import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string().optional(),
  title: z.string().optional(),
  qty: z.coerce.number().int().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  originalPrice: z.coerce.number().nonnegative().optional(),
  priceUnit: z.string().optional(),
  img: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  sku: z.string().optional(),
  subcategorySerial: z.string().optional(),
});

const customerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export const payfastInitSchema = z.object({
  cartItems: z.array(cartItemSchema).min(1, "Cart is empty"),
  customer: customerSchema.optional().default({}),
  couponCode: z.string().optional().default(""),
});

// PayFast posts arbitrary key/value pairs in its IPN notify call. We don't
// enforce a strict schema here — handler reads required fields defensively.
export const payfastNotifySchema = z.any();
