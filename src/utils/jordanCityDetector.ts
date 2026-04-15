// Lightweight city detection for Jordan's major governorates.
// Uses geographic bounding boxes — no network call required.
// Covers the three cities for which we have local hero images.

export type DetectedCity = 'Amman' | 'Irbid' | 'Zarqa';

interface BBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const JORDAN_CITIES: Array<{name: DetectedCity; bbox: BBox}> = [
  // Amman governorate — central Jordan
  {
    name: 'Amman',
    bbox: {minLat: 31.70, maxLat: 32.15, minLng: 35.75, maxLng: 36.15},
  },
  // Irbid governorate — northern Jordan
  {
    name: 'Irbid',
    bbox: {minLat: 32.40, maxLat: 32.70, minLng: 35.75, maxLng: 36.00},
  },
  // Zarqa governorate — northeast of Amman
  {
    name: 'Zarqa',
    bbox: {minLat: 31.95, maxLat: 32.20, minLng: 36.05, maxLng: 36.30},
  },
];

/** Geographic centre of each supported city — used as the map fly-to target. */
export const CITY_CENTERS: Record<DetectedCity, {lat: number; lng: number}> = {
  Amman: {lat: 31.9539, lng: 35.9106},
  Irbid: {lat: 32.5556, lng: 35.8500},
  Zarqa: {lat: 32.0720, lng: 36.0878},
};

/**
 * Returns the name of the matching Jordan city, or null if the coordinates
 * fall outside all known bounding boxes.
 */
export const detectJordanCity = (lat: number, lng: number): DetectedCity | null => {
  for (const {name, bbox} of JORDAN_CITIES) {
    if (
      lat >= bbox.minLat &&
      lat <= bbox.maxLat &&
      lng >= bbox.minLng &&
      lng <= bbox.maxLng
    ) {
      return name;
    }
  }
  return null;
};
