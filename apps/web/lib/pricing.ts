export function pricingHref(vehicle?: string | null): string {
  return vehicle ? `/pricing?vehicle=${encodeURIComponent(vehicle.toLowerCase())}` : "/pricing";
}
