import { CourierProviderInterface } from "./CourierProviderInterface.js";
import { env } from "../../config/env.js";

export class LeopardsCourierAdapter extends CourierProviderInterface {
  constructor() {
    super("leopards");
  }

  async createShipment({ order, parcelWeightKg = 0.5, codAmount = 0, remarks = "" }) {
    const isLive = Boolean(env.COURIER.LEOPARDS.API_KEY && env.COURIER.LEOPARDS.API_PASSWORD);

    if (isLive) {
      try {
        const payload = {
          api_key: env.COURIER.LEOPARDS.API_KEY,
          api_password: env.COURIER.LEOPARDS.API_PASSWORD,
          booked_packet_weight: Math.round(parcelWeightKg * 1000), // grams
          booked_packet_vol_weight_w: "10",
          booked_packet_vol_weight_h: "10",
          booked_packet_vol_weight_l: "10",
          booked_packet_no_piece: 1,
          booked_packet_collect_amount: codAmount,
          booked_packet_order_id: order.orderReference,
          origin_city: "Islamabad",
          destination_city: order.shippingAddress.city,
          shipment_name_eng: order.customer.name,
          shipment_email: order.customer.email || "",
          shipment_phone: order.customer.phone,
          shipment_address: order.shippingAddress.address,
          special_instructions: remarks || order.shippingAddress.notes || "Handle with care",
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${env.COURIER.LEOPARDS.API_URL}/bookPacket/format/json/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json();
        if (!res.ok || data.status !== 1) {
          throw new Error(data.error || data.message || "Leopards API booking failed");
        }

        const trackingNumber = data.track_number;
        return {
          success: true,
          provider: "leopards",
          trackingNumber,
          trackingUrl: `https://leopardscourier.com/tracking?track=${trackingNumber}`,
          labelUrl: `https://leopardscourier.com/print_slip?track=${trackingNumber}`,
          estimatedDelivery: "2–3 working days via Leopards COD",
          rawResponse: data,
        };
      } catch (err) {
        throw new Error(`Leopards API Shipment Creation Failed: ${err.message}`);
      }
    }

    // Sandbox / mock simulation
    const cleanRef = order.orderReference.replace(/[^A-Za-z0-9]/g, "");
    const trackingNumber = `LEO-${cleanRef}${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      provider: "leopards",
      trackingNumber,
      trackingUrl: `https://leopardscourier.com/tracking?track=${trackingNumber}`,
      labelUrl: `https://leopardscourier.com/print_slip?track=${trackingNumber}`,
      estimatedDelivery: "2–3 working days via Leopards COD",
      rawResponse: {
        mode: "sandbox",
        provider: "leopards",
        track_number: trackingNumber,
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
      currentLocation: "Leopards Central Hub",
      events: [
        {
          status: "manifested",
          location: "Islamabad Branch",
          timestamp: new Date(Date.now() - 5000000).toISOString(),
          message: "Packet booked at Leopards counter",
        },
        {
          status: "in_transit",
          location: "Leopards Central Hub",
          timestamp: new Date().toISOString(),
          message: "Dispatched to destination station",
        },
      ],
      rawResponse: { track_number: trackingNumber, status: "In Transit" },
    };
  }

  async cancelShipment(trackingNumber, reason = "") {
    return {
      success: true,
      message: `Leopards packet ${trackingNumber} cancelled`,
      rawResponse: { track_number: trackingNumber, status: "cancelled", reason },
    };
  }

  async getLabel(trackingNumber) {
    return {
      labelUrl: `https://leopardscourier.com/print_slip?track=${trackingNumber}`,
      format: "PDF",
    };
  }
}

export default LeopardsCourierAdapter;
