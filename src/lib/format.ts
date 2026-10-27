const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(n: number | null | undefined) {
  return n == null ? "—" : usd.format(n);
}
