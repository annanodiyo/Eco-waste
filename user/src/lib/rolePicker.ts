const OPEN_EVENT = "ecotoken:open-role-picker";
const QUEUE_KEY = "ecotoken:role-picker-queued";

export function openRolePicker() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function onRolePickerOpen(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = () => handler();
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}

export function queueRolePickerOpen() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(QUEUE_KEY, "1");
}

export function consumeQueuedRolePickerOpen(): boolean {
  if (typeof window === "undefined") return false;
  const queued = window.sessionStorage.getItem(QUEUE_KEY) === "1";
  if (queued) window.sessionStorage.removeItem(QUEUE_KEY);
  return queued;
}
