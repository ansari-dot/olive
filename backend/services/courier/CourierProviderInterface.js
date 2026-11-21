/**
 * Base Courier Provider Interface.
 * All courier adapters (TCS, Leopards, Trax, M&P, Mock) must implement these methods.
 */
export class CourierProviderInterface {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generates a shipment booking with the courier provider.
   *
   * @param {Object} options
   * @param {Object} options.order - The order document
   * @param {number} options.parcelWeightKg - Parcel weight in kg
   * @param {number} options.codAmount - Cash on Delivery collection amount
   * @param {string} options.remarks - Delivery instructions
   * @returns {Promise<{
   *   success: boolean,
   *   provider: string,
   *   trackingNumber: string,
   *   trackingUrl: string,
   *   labelUrl?: string,
   *   estimatedDelivery?: string,
   *   rawResponse?: any
   * }>}
   */
  async createShipment(options) {
    throw new Error(`Method createShipment() not implemented in ${this.name}`);
  }

  /**
   * Queries real-time tracking information from the courier provider.
   *
   * @param {string} trackingNumber
   * @returns {Promise<{
   *   success: boolean,
   *   trackingNumber: string,
   *   status: string,
   *   currentLocation?: string,
   *   events: Array<{ status: string, location: string, timestamp: string, message: string }>,
   *   rawResponse?: any
   * }>}
   */
  async trackShipment(trackingNumber) {
    throw new Error(`Method trackShipment() not implemented in ${this.name}`);
  }

  /**
   * Cancels a previously booked consignment before dispatch.
   *
   * @param {string} trackingNumber
   * @param {string} reason
   * @returns {Promise<{ success: boolean, message: string, rawResponse?: any }>}
   */
  async cancelShipment(trackingNumber, reason) {
    throw new Error(`Method cancelShipment() not implemented in ${this.name}`);
  }

  /**
   * Retrieves printable air waybill / shipping label URL or PDF buffer.
   *
   * @param {string} trackingNumber
   * @returns {Promise<{ labelUrl: string, format: string }>}
   */
  async getLabel(trackingNumber) {
    throw new Error(`Method getLabel() not implemented in ${this.name}`);
  }
}

export default CourierProviderInterface;
