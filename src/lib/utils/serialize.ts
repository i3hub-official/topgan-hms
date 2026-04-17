/**
 * Deeply serializes any data structure to ensure it's a plain JavaScript object
 * that can be safely passed from server to client in SvelteKit
 */
export function serialize<T>(data: T): T {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data as T;
  }

  // Handle BigInt
  if (typeof data === 'bigint') {
    return Number(data) as T;
  }

  // Handle Date
  if (data instanceof Date) {
    return data.getTime() as T;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serialize(item)) as T;
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check if it's a Drizzle model (has prototype chain)
    const isPlainObject = Object.getPrototypeOf(data) === Object.prototype;
    
    if (!isPlainObject) {
      // Convert Drizzle model to plain object by extracting only its own properties
      const plainObj: Record<string, any> = {};
      for (const key of Object.keys(data)) {
        plainObj[key] = serialize((data as any)[key]);
      }
      return plainObj as T;
    }

    // Plain object - recursively serialize all properties
    const result: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serialize((data as any)[key]);
      }
    }
    return result as T;
  }

  // Return primitives as-is
  return data;
}