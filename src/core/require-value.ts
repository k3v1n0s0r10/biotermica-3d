/** Enforce required DOM, catalog, and geometry values at runtime. */
export function requireValue<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error('A required project value is missing.');
  }
  return value;
}
