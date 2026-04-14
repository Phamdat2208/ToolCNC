export interface Category {
  id?: number;
  name: string;
  productCount?: number;
  totalProductCount?: number;
  icon?: string;
  parentId?: number;
  children?: Category[];
}
