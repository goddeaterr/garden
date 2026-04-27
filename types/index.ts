export type TreeCategory = 'fruit' | 'decorative' | 'evergreen' | 'shrub';
export type TreeSize = 'small' | 'medium' | 'large';

export interface TreeCare {
  watering: string;
  sunlight: string;
  soil: string;
  pruning: string;
  hardiness: string;
  spacing: string;
  growthRate: string;
  notes: string;
}

export interface Tree {
  id: string;
  name: string;
  latin: string;
  category: TreeCategory;
  size: TreeSize;
  price: number;
  height: string;
  description: string;
  svg: string;
  imagePath?: string;
  color: string;
  bloom?: string;
  care: TreeCare;
}

export interface PlacedTree {
  uid: string;
  treeId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipped: boolean;
  opacity: number;
  z: number;
}
