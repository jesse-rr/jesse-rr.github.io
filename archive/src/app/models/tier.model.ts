export interface Tier {
  id: string;
  name: string;
  color: string;
  items: TierItem[];
}

export interface TierItem {
  id: string;
  text: string;
  imageUrl?: string;
  tierId: string;
}

export interface TierList {
  id: string;
  name: string;
  tiers: Tier[];
  createdAt: Date;
  updatedAt: Date;
}