export type TreeCategory = 'trees' | 'shrubs' | 'perennial' | 'annual' | 'conifer' | 'climbing' | 'hedge' | 'potted' | 'grass';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imagePath?: string;
  tag?: string;
  publishedAt: string; // ISO string
}
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
  svg?: string;
  imagePath?: string;
  builderImagePath?: string;
  color: string;
  bloom?: string;
  care: TreeCare;
}
