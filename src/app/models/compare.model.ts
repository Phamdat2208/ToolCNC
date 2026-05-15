export interface CompareProduct {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  brand?: { name: string } | string | any;
  category?: { name: string } | string | any;
  specs?: string | any[];
  stock?: number;
}
