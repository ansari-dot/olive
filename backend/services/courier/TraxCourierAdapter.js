import { CourierProviderInterface } from "./CourierProviderInterface.js";
import { env } from "../../config/env.js";

export class TraxCourierAdapter extends CourierProviderInterface {
  constructor() {
    super("trax");
  }

  async createShipment({ order, parcelWeightKg = 0.5, codAmount = 0, remarks = "" }) {
    const isLive = Boolean(env.COURIER.TRAX.API_KEY);

    if (isLive) {
      try {
        const payload = {
          service_type_id: 1, // Regular Rush
          pickup_address_id: 1,
          information_display: 1,
          consignee_name: order.customer.name,
          consignee_email: order.customer.email || "",
          consignee_phone_number_1: order.customer.phone,
          consignee_address: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
          consignee_city_id: 202, // City ID
          order_id: order.orderReference,
          item_product_type_id: 1,
          item_description: order.items.map((i) => i.name).join(", "),
          item_quantity: order.items.reduce((acc, i) => acc + i.quantity, 0),
          item_insurance: 0,
          item_price: codAmount,
          item_weight: parcelWeightKg,
          special_instructions: remarks || order.shippingAddress.notes || "",
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${env.COURIER.TRAX.API_URL}/shipment/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: env.COURIER.TRAX.API_KEY,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json();
        if (!res.ok || data.status !== 0) {
          throw new Error(data.message || data.error || "Trax API booking failed");
        }

        const trackingNumber = data.tracking_number;
        return {
          success: true,
          provider: "trax",
          trackingNumber,
          trackingUrl: `https://sonic.pk/tracking?tracking_number=${trackingNumber}`,
          labelUrl: `https://sonic.pk/airwaybill/${trackingNumber}`,
          estimatedDelivery: "2–3 working days via Trax Logistics",
          rawResponse: data,
        };
      } catch (err) {
        throw new Error(`Trax API Shipment Creation Failed: ${err.message}`);
      }
    }

    // Sandbox / mock simulation
    const cleanRef = order.orderReference.replace(/[^A-Za-z0-9]/g, "");
    const trackingNumber = `TRX-${cleanRef}${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      provider: "trax",
      trackingNumber,
      trackingUrl: `https://sonic.pk/tracking?tracking_number=${trackingNumber}`,
      labelUrl: `https://sonic.pk/airwaybill/${trackingNumber}`,
      estimatedDelivery: "2–3 working days via Trax Logistics",
      rawResponse: {
        mode: "sandbox",
        provider: "trax",
        tracking_number: trackingNumber,
        bookingDate: new Date().toISOString(),
        weightKg: parcelWeightKg,
        codAmount,
      },
    };
  }

  async trackShipment(trackingNumber) {
    return {
      success: true,
      trackingNumber,
      status: "in_transit",
      currentLocation: "Trax Transit Center",
      events: [
        {
          status: "manifested",
          location: "Islamabad Facility",
          timestamp: new Date(Date.now() - 4000000).toISOString(),
          message: "Shipment generated and ready for pickup",
        },
        {
          status: "in_transit",
          location: "Trax Transit Center",
          timestamp: new Date().toISOString(),
          message: "Consignment processed in sorting center",
        },
      ],
      rawResponse: { tracking_number: trackingNumber, status: "In Transit" },
    };
  }

  async cancelShipment(trackingNumber, reason = "") {
    return {
      success: true,
      message: `Trax shipment ${trackingNumber} cancelled`,
      rawResponse: { tracking_number: trackingNumber, status: "cancelled", reason },
    };
  }

  async getLabel(trackingNumber) {
    return {
      labelUrl: `https://sonic.pk/airwaybill/${trackingNumber}`,
      format: "PDF",
    };
  }
}

export default TraxCourierAdapter;
