/** Core data structures used across LuxLab. */
export interface RoomConfig {
  length: number; // meters
  width: number; // meters
  height: number; // meters
  mountingHeight: number; // meters above floor
  workplaneHeight: number; // meters above floor
  reflectances: {
    ceiling: number;
    walls: number;
    floor: number;
  };
}

export interface LayoutConfig {
  rows: number;
  columns: number;
  rowSpacing: number;
  columnSpacing: number;
  offsetX: number;
  offsetY: number;
}

export interface PhotometryData {
  verticalAngles: number[];
  horizontalAngles: number[];
  candelas: number[][]; // [horizontal][vertical]
  metadata?: Record<string, string>;
  totalLumens?: number;
}

export interface LuminaireConfig {
  id: string;
  name: string;
  description: string;
  lumens: number;
  photometry: PhotometryData;
}

export interface CalculationResult {
  grid: number[][]; // lux values [row][col]
  average: number;
  min: number;
  max: number;
  uniformity: number; // min / avg
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
}

export interface DemoLuminaireMeta {
  id: string;
  name: string;
  description: string;
  iesPath: string;
}
