import { CourierProviderInterface } from "./CourierProviderInterface.js";
import { env } from "../../config/env.js";

export class MnpCourierAdapter extends CourierProviderInterface {
  constructor() {
    super("mnp");
  }

  async createShipment({ order, parcelWeightKg = 0.5, codAmount = 0, remarks = "" }) {
    const isLive = Boolean(env.COURIER.MNP.USERNAME && env.COURIER.MNP.PASSWORD);

    if (isLive) {
      try {
        const payload = {
          username: env.COURIER.MNP.USERNAME,
          password: env.COURIER.MNP.PASSWORD,
          account_no: env.COURIER.MNP.ACCOUNT_NO,
          consignee_name: order.customer.name,
          consignee_phone: order.customer.phone,
          consignee_email: order.customer.email || "",
          consignee_address: order.shippingAddress.address,
          destination_city: order.shippingAddress.city,
          weight: parcelWeightKg,
          pieces: 1,
          cod_amount: codAmount,
          customer_ref: order.orderReference,
          remarks: remarks || "Artisanal Cold-Pressed Bottles",
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${env.COURIER.MNP.API_URL}/booking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json();
        if (!res.ok || !data.cn_number) {
          throw new Error(data.message || data.error || "M&P API booking failed");
        }

        const trackingNumber = data.cn_number;
        return {
          success: true,
          provider: "mnp",
          trackingNumber,
          trackingUrl: `https://mulphilog.com/tracking?tracking=${trackingNumber}`,
          labelUrl: `https://mulphilog.com/print/${trackingNumber}`,
          estimatedDelivery: "2–3 working days via M&P Express",
          rawResponse: data,
        };
      } catch (err) {
        throw new Error(`M&P API Shipment Creation Failed: ${err.message}`);
      }
    }

    // Sandbox / mock simulation
    const cleanRef = order.orderReference.replace(/[^A-Za-z0-9]/g, "");
    const trackingNumber = `MNP-${cleanRef}${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      provider: "mnp",
      trackingNumber,
      trackingUrl: `https://mulphilog.com/tracking?tracking=${trackingNumber}`,
      labelUrl: `https://mulphilog.com/print/${trackingNumber}`,
      estimatedDelivery: "2–3 working days via M&P Express",
      rawResponse: {
        mode: "sandbox",
        provider: "mnp",
        cn_number: trackingNumber,
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
      currentLocation: "M&P Hub Rawalpindi",
      events: [
        {
          status: "manifested",
          location: "M&P Express Center Islamabad",
          timestamp: new Date(Date.now() - 4800000).toISOString(),
          message: "CN booked successfully",
        },
        {
          status: "in_transit",
          location: "M&P Hub Rawalpindi",
          timestamp: new Date().toISOString(),
          message: "Consignment dispatched in route manifest",
        },
      ],
      rawResponse: { cn_number: trackingNumber, status: "In Transit" },
    };
  }

  async cancelShipment(trackingNumber, reason = "") {
    return {
      success: true,
      message: `M&P consignment ${trackingNumber} cancelled`,
      rawResponse: { cn_number: trackingNumber, status: "cancelled", reason },
    };
  }

  async getLabel(trackingNumber) {
    return {
      labelUrl: `https://mulphilog.com/print/${trackingNumber}`,
      format: "PDF",
    };
  }
}

export default MnpCourierAdapter;
