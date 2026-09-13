import { PosProduct } from './counter-sale.models';

export interface SearchProduct extends PosProduct {
  availableStock: number;
  minimumStock: number;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  favorite: boolean;
  soldQuantity: number;
}
export interface ProductFacet { id: string; name: string }
export interface SearchPage<T> { items: readonly T[]; total: number; page: number }
export type ProductCollection = 'all' | 'favorites' | 'best' | 'recent';
export interface ProductSearch {
  warehouseId: string;
  query: string;
  category: ProductFacet | null;
  brand: ProductFacet | null;
  minimumPrice?: number;
  maximumPrice?: number;
  inStockOnly: boolean;
  lowStockOnly: boolean;
  collection: ProductCollection;
  page: number;
}
export const emptyProductSearch: ProductSearch = {
  warehouseId: '', query: '', category: null, brand: null,
  inStockOnly: false, lowStockOnly: false, collection: 'all', page: 1,
};
