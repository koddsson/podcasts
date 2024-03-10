/*
 * Functions designed to help you sync data more easily to `localStorage`. Quality of life
 * improvements such as: serialization to and from JSON, nested property updates and type-safety.
 */

export function getState<T extends Record<string, unknown>>(key: string): T {
  return JSON.parse(localStorage.getItem(key) || "{}");
}

export function setState<T extends Record<string, unknown>>(
  key: string,
  state: T,
): void {
  const currentState = getState(key);
  localStorage.setItem(key, JSON.stringify({ ...currentState, ...state }));
}
