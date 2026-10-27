// One-shot message carried across a client-side navigation (e.g. "Request sent").
let message: string | null = null;

export function setFlash(m: string) {
  message = m;
}

export function takeFlash() {
  const m = message;
  message = null;
  return m;
}
