/**
 * Quick example (matches curl usage):
 *   await callDataApi("Youtube/search", {
 *     query: { gl: "US", hl: "en", q: "manus" },
 *   })
 */
import { ENV } from "./env";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

/**
 * Local mode: Data API is not available without Manus Forge.
 * This stub returns an error message. Replace with direct API calls as needed.
 */
export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions = {}
): Promise<unknown> {
  console.warn(`[DataApi] callDataApi("${apiId}") called but Manus Forge is not available in local mode.`);
  console.warn(`[DataApi] To use external APIs, call them directly with fetch() and your own API keys.`);
  throw new Error(
    `Data API "${apiId}" is not available in local mode. Use direct API calls instead.`
  );
}
