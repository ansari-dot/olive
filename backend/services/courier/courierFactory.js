import MockCourierAdapter from "./MockCourierAdapter.js";
import TcsCourierAdapter from "./TcsCourierAdapter.js";
import LeopardsCourierAdapter from "./LeopardsCourierAdapter.js";
import TraxCourierAdapter from "./TraxCourierAdapter.js";
import MnpCourierAdapter from "./MnpCourierAdapter.js";
import { env } from "../../config/env.js";

const adapters = {
  mock: new MockCourierAdapter("mock"),
  tcs: new TcsCourierAdapter(),
  leopards: new LeopardsCourierAdapter(),
  trax: new TraxCourierAdapter(),
  mnp: new MnpCourierAdapter(),
};

/**
 * Factory to get a courier adapter instance by name.
 *
 * @param {string} providerName - 'mock' | 'tcs' | 'leopards' | 'trax' | 'mnp'
 * @returns {import("./CourierProviderInterface.js").CourierProviderInterface}
 */
export function getCourierAdapter(providerName) {
  const normalized = (
    providerName ||
    env.COURIER.ACTIVE_PROVIDER ||
    "mock"
  )
    .toLowerCase()
    .trim();

  if (adapters[normalized]) {
    return adapters[normalized];
  }

  console.warn(
    `[CourierFactory] Unrecognized courier provider "${providerName}", defaulting to mock sandbox adapter.`
  );
  return adapters.mock;
}

export default getCourierAdapter;
