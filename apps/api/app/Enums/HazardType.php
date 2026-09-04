<?php

namespace App\Enums;

/**
 * Normalized hazard categories shown as filter chips on the intro card and coloured markers in
 * the player. The crawl's own `type` vocabulary is only `sign` / `pedestrian` / `vehicle`
 * (see HazardType::fromSource), but `signal` and `road_mark` are defined now so a later content
 * pass — or a staff edit in admin — can use the finer categories without an enum migration.
 */
enum HazardType: string
{
    case Sign = 'sign';
    case Pedestrian = 'pedestrian';
    case Vehicle = 'vehicle';
    case Signal = 'signal';
    case RoadMark = 'road_mark';

    /**
     * Map a raw crawl `type` string onto a normalized case. Unknown values fall back to `Vehicle`
     * (the most common category, and the safest generic "something on the road ahead" marker) —
     * the importer logs the raw value alongside so staff can reclassify it.
     */
    public static function fromSource(?string $raw): self
    {
        return match (strtolower(trim((string) $raw))) {
            'sign' => self::Sign,
            'pedestrian', 'cyclist', 'bicycle', 'person' => self::Pedestrian,
            'signal', 'light', 'traffic_light', 'traffic-light' => self::Signal,
            'road_mark', 'road-mark', 'roadmark', 'marking', 'lane' => self::RoadMark,
            default => self::Vehicle,
        };
    }

    /** UI label for the category chip. */
    public function label(): string
    {
        return match ($this) {
            self::Sign => 'Sign',
            self::Pedestrian => 'Pedestrian',
            self::Vehicle => 'Vehicle',
            self::Signal => 'Signal',
            self::RoadMark => 'Road marking',
        };
    }

    /**
     * Where a marker for this category is drawn when a hazard has no authored `box` — a coarse
     * screen zone biased by how this kind of hazard usually appears in dashcam footage. Normalized
     * 0–1 `{x,y,w,h}`, consumed by the web/mobile player's fallback overlay. Staff-authored boxes
     * on `hazards.box` always win over this.
     */
    public function defaultZone(): array
    {
        return match ($this) {
            // Signs sit high and to the right of the road.
            self::Sign => ['x' => 0.60, 'y' => 0.08, 'w' => 0.34, 'h' => 0.34],
            // Signals hang high and central.
            self::Signal => ['x' => 0.34, 'y' => 0.04, 'w' => 0.32, 'h' => 0.30],
            // Pedestrians / cyclists enter low from either kerb — a wide band across the lower third.
            self::Pedestrian => ['x' => 0.06, 'y' => 0.52, 'w' => 0.88, 'h' => 0.42],
            // Road markings are on the tarmac, low and central.
            self::RoadMark => ['x' => 0.28, 'y' => 0.60, 'w' => 0.44, 'h' => 0.34],
            // Vehicles develop dead ahead.
            self::Vehicle => ['x' => 0.30, 'y' => 0.30, 'w' => 0.40, 'h' => 0.40],
        };
    }
}
