/** Hero artwork per vehicle type, so a Motorcycle or CDL page never shows a passenger car.
 * Keys match the labels `useWebLayout().selectedVehicle` holds ("Car" | "Motorcycle" | "CDL"). */
const VEHICLE_HERO_IMAGES: Record<string, { src: string; alt: string }> = {
  Car: { src: "/statehub-banner.png", alt: "Cars at a four-way intersection" },
  Motorcycle: { src: "/license-types/card-motorcycle.png", alt: "Motorcycle on a mountain road" },
  CDL: { src: "/license-types/card-cdl.png", alt: "Commercial truck on the highway" },
};

export function vehicleHeroImage(vehicle: string): { src: string; alt: string } {
  return VEHICLE_HERO_IMAGES[vehicle] ?? VEHICLE_HERO_IMAGES.Car;
}
