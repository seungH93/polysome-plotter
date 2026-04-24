export interface DataPoint {
  fraction: number;
  absorbance: number;
}

export interface Sample {
  id: string;
  name: string;
  color: string;
  data: DataPoint[];
  // User-controlled alignment offsets applied at render time.
  xShift: number;
  yShift: number;
  visible: boolean;
}
