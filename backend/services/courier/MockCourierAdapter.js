import { CourierProviderInterface } from "./CourierProviderInterface.js";
import { env } from "../../config/env.js";

export class MockCourierAdapter extends CourierProviderInterface {
  constructor(name = "mock") {
    super(name);
  }

  async createShipment({ order, parcelWeightKg = 0.5, codAmount = 0, remarks = "" }) {
    const cleanRef = order.orderReference.replace(/[^A-Za-z0-9]/g, "");
    const trackingNumber = `MCK-${cleanRef}-${Date.now().toString().slice(-4)}`;
    const baseUrl = env.SERVER_URL || "http://localhost:5000";

    const trackingUrl = `${baseUrl}/api/orders/track/${order.orderReference}`;
    const labelUrl = `${baseUrl}/api/orders/${order.orderReference}/label`;

    return {
      success: true,
      provider: this.name,
      trackingNumber,
      trackingUrl,
      labelUrl,
      estimatedDelivery: "2–3 working days via Express Delivery",
      rawResponse: {
        statusCode: 200,
        message: "Consignment booked successfully (Sandbox)",
        consignmentNo: trackingNumber,
        bookingDate: new Date().toISOString(),
        weight: parcelWeightKg,
        codAmount,
        destinationCity: order.shippingAddress.city,
        consigneeName: order.customer.name,
        remarks,
      },
    };
  }

  async trackShipment(trackingNumber) {
    return {
      success: true,
      trackingNumber,
      status: "in_transit",
      currentLocation: "Islamabad Linehaul Hub",
      events: [
        {
          status: "manifested",
          location: "Islamabad Orchard Hub",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          message: "Consignment electronic booking confirmed",
        },
        {
          status: "in_transit",
          location: "Islamabad Linehaul Hub",
          timestamp: new Date().toISOString(),
          message: "Parcel sorted into regional delivery container",
        },
      ],
      rawResponse: {
        trackingNumber,
        status: "in_transit",
      },
    };
  }

  async cancelShipment(trackingNumber, reason = "") {
    return {
      success: true,
      message: `Consignment ${trackingNumber} cancelled in sandbox`,
      rawResponse: {
        trackingNumber,
        status: "cancelled",
        reason,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getLabel(trackingNumber) {
    const baseUrl = env.SERVER_URL || "http://localhost:5000";
    return {
      labelUrl: `${baseUrl}/api/orders/label/${trackingNumber}`,
      format: "PDF",
    };
  }
}

export default MockCourierAdapter;
