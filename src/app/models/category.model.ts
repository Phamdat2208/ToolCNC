export interface Category {
  id?: number;
  name: string;
  productCount?: number;
  icon?: string;
  parentId?: number;
  children?: Category[];
}
