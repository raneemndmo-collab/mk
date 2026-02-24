export { Beds24TokenManager } from "./auth/token-manager.js";
export { Beds24Client, type Beds24ClientConfig } from "./auth/client.js";
export { PropertiesWrapper, type Beds24Property, type Beds24Room } from "./wrappers/properties.js";
export { InventoryWrapper, type InventoryDay, type InventoryWriteDay } from "./wrappers/inventory.js";
export {
  BookingsWrapper,
  type Beds24Booking,
  type Beds24BookingCreate,
  type Beds24BookingUpdate,
} from "./wrappers/bookings.js";
export { GuestsWrapper, type Beds24Guest, type Beds24Message } from "./wrappers/guests.js";
export { Beds24AdminProxy, ProxyError, type ProxyAuditEntry } from "./proxy/admin-proxy.js";

import { Beds24Client, type Beds24ClientConfig } from "./auth/client.js";
import { PropertiesWrapper } from "./wrappers/properties.js";
import { InventoryWrapper } from "./wrappers/inventory.js";
import { BookingsWrapper } from "./wrappers/bookings.js";
import { GuestsWrapper } from "./wrappers/guests.js";
import { Beds24AdminProxy } from "./proxy/admin-proxy.js";

/** Convenience: create all wrappers from a single config. */
export function createBeds24SDK(config: Beds24ClientConfig) {
  const client = new Beds24Client(config);
  return {
    client,
    properties: new PropertiesWrapper(client),
    inventory: new InventoryWrapper(client),
    bookings: new BookingsWrapper(client),
    guests: new GuestsWrapper(client),
    adminProxy: new Beds24AdminProxy(client),
  };
}
