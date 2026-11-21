import Product from "../models/Product.js";
import Deal from "../models/Deal.js";
import Coupon from "../models/Coupon.js";
import { invalidateCache } from "../middlewares/cache.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Atomically reserve inventory and deal stock for an order's items.
 * If any item lacks sufficient stock or exceeds deal limits, all
 * previously acquired reservations are immediately rolled back.
 *
 * @param {Array} items - Array of resolved order items
 * @returns {Promise<{ success: boolean, reservedItems: Array }>}
 */
export async function reserveOrderInventory(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("No items specified for inventory reservation");
  }

  const reservedItems = [];

  for (const item of items) {
    const qty = item.quantity;
    let dealReserved = false;

    // 1. If item has an active deal, conditionally reserve deal quota
    if (item.dealId) {
      const dealDoc = await Deal.findById(item.dealId).lean();
      if (dealDoc) {
        if (dealDoc.dealStockLimit > 0) {
          const updatedDeal = await Deal.findOneAndUpdate(
            {
              _id: item.dealId,
              $expr: {
                $lte: [{ $add: ["$dealSoldCount", qty] }, "$dealStockLimit"],
              },
            },
            { $inc: { dealSoldCount: qty } },
            { new: true }
          );

          if (!updatedDeal) {
            // Flash deal quota sold out! Roll back prior reservations
            await rollbackInventory(reservedItems);
            throw ApiError.badRequest(
              `Deal stock limit reached for "${item.name}". Flash deal quota is sold out.`
            );
          }
          dealReserved = true;
        } else {
          // Unlimited deal stock
          await Deal.findByIdAndUpdate(item.dealId, {
            $inc: { dealSoldCount: qty },
          });
          dealReserved = true;
        }
      }
    }

    // 2. Conditionally reserve product stock directly from MongoDB
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: item.product,
        stock: { $gte: qty },
        isActive: true,
      },
      {
        $inc: {
          stock: -qty,
          soldCount: qty,
        },
      },
      { new: true }
    );

    if (!updatedProduct) {
      // Rollback deal quota if reserved for this failed item
      if (dealReserved && item.dealId) {
        await Deal.findByIdAndUpdate(item.dealId, {
          $inc: { dealSoldCount: -qty },
        });
      }

      // Rollback all previously acquired reservations
      await rollbackInventory(reservedItems);

      // Check current live stock to give a descriptive error
      const currentProd = await Product.findById(item.product).lean();
      const currentStock = currentProd ? currentProd.stock : 0;
      throw ApiError.badRequest(
        `Insufficient stock for "${item.name}". Available: ${currentStock}, requested: ${qty}`
      );
    }

    reservedItems.push({
      product: item.product,
      quantity: qty,
      name: item.name,
      dealId: item.dealId || null,
      dealReserved,
    });
  }

  invalidateCache("/api/products");
  invalidateCache("/api/deals");

  return { success: true, reservedItems };
}

/**
 * Compensating transaction: rolls back all reserved items in case of
 * partial failures or order creation errors.
 *
 * @param {Array} reservedItems
 */
export async function rollbackInventory(reservedItems) {
  if (!Array.isArray(reservedItems) || reservedItems.length === 0) {
    return;
  }

  for (const item of reservedItems) {
    try {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: item.quantity,
          soldCount: -item.quantity,
        },
      });

      if (item.dealId && item.dealReserved !== false) {
        await Deal.findByIdAndUpdate(item.dealId, {
          $inc: { dealSoldCount: -item.quantity },
        });
      }
    } catch (err) {
      console.error(
        `[InventoryService] Error during inventory rollback for product ${item.product}:`,
        err.message
      );
    }
  }

  invalidateCache("/api/products");
  invalidateCache("/api/deals");
}

/**
 * Restores product stock and deal quotas when an order is cancelled.
 * Guarantees idempotency via order.inventoryState.
 *
 * @param {Object} order - Mongoose Order document
 * @param {string} reason
 * @param {string} updatedBy
 * @returns {Promise<boolean>} whether stock was restored
 */
export async function restoreOrderInventory(order, reason = "", updatedBy = "System") {
  if (!order || !order.items) return false;

  // Idempotency check: Never restore twice!
  if (order.inventoryState === "restored") {
    return false;
  }

  for (const item of order.items) {
    try {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: item.quantity,
          soldCount: -item.quantity,
        },
      });

      if (item.dealId) {
        await Deal.findByIdAndUpdate(item.dealId, {
          $inc: { dealSoldCount: -item.quantity },
        });
      }
    } catch (err) {
      console.error(
        `[InventoryService] Error restoring stock for order ${order.orderReference}, item ${item.product}:`,
        err.message
      );
    }
  }

  // Atomically decrement Coupon usedCount if coupon was applied
  if (order.couponCode) {
    try {
      await Coupon.findOneAndUpdate(
        { code: order.couponCode },
        { $inc: { usedCount: -1 } }
      );
    } catch {
      // non-blocking
    }
  }

  order.inventoryState = "restored";

  invalidateCache("/api/products");
  invalidateCache("/api/deals");

  return true;
}

/**
 * Restores returned items into inventory after physical inspection and approval.
 *
 * @param {Object} order - Mongoose Order document
 * @param {number} restockQuantity - Number of units approved for restocking
 * @param {string} note - Inspection note
 * @param {Object} adminUser - Admin user performing the inspection
 */
export async function restockReturnedUnits(order, restockQuantity, note, adminUser) {
  if (!order || !order.items) {
    throw ApiError.badRequest("Invalid order for return restock");
  }

  if (order.returnDetails?.status === "restocked") {
    throw ApiError.badRequest("This order has already been restocked");
  }

  const totalOrderUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);
  const unitsToRestock =
    typeof restockQuantity === "number" && restockQuantity > 0
      ? Math.min(restockQuantity, totalOrderUnits)
      : totalOrderUnits;

  // Distribute restock proportional or direct for single item
  if (order.items.length === 1) {
    const item = order.items[0];
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        stock: unitsToRestock,
        soldCount: -unitsToRestock,
      },
    });
  } else {
    // If multi-item and full return restock
    if (unitsToRestock === totalOrderUnits) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            stock: item.quantity,
            soldCount: -item.quantity,
          },
        });
      }
    } else {
      // Partial restock: restore first item up to restock count
      let remaining = unitsToRestock;
      for (const item of order.items) {
        if (remaining <= 0) break;
        const add = Math.min(remaining, item.quantity);
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            stock: add,
            soldCount: -add,
          },
        });
        remaining -= add;
      }
    }
  }

  order.inventoryState = "restored";
  order.returnDetails = {
    status: "restocked",
    reason: order.returnDetails?.reason || "Customer return approved",
    inspectedBy: adminUser?.name || "Admin",
    inspectedAt: new Date(),
    restockedAt: new Date(),
    restockedQuantity: unitsToRestock,
    auditNote: note || "Items inspected and returned to warehouse inventory",
  };

  order.orderStatus = "returned";

  invalidateCache("/api/products");
  invalidateCache("/api/deals");

  return order;
}
