import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { PosProductsService } from '../../../../core/api/generated/services/pos-products.service';
import { PosProductResponse } from '../../../../core/api/generated/models/pos-product-response';
import { ProductSearch, SearchProduct, SearchPage, ProductFacet } from '../models/product-search.models';

@Injectable({ providedIn: 'root' })
export class ProductSearchAdapter {
  private readonly api = inject(PosProductsService);

  search(request: ProductSearch, ids?: string[], exactBarcode = false) {
    return this.api.apiV1PosProductsGet({
      WarehouseId: request.warehouseId, Search: request.query,
      CategoryId: request.category?.id, BrandId: request.brand?.id,
      MinimumPrice: request.minimumPrice, MaximumPrice: request.maximumPrice,
      InStockOnly: request.inStockOnly, LowStockOnly: request.lowStockOnly,
      FavoritesOnly: request.collection === 'favorites', BestSellersOnly: request.collection === 'best',
      ProductIds: ids, ExactBarcode: exactBarcode, Page: request.page, PageSize: 30,
    }).pipe(map(response => {
      if (!response.success || !response.data) throw new Error('No pudimos consultar los productos.');
      return { items: (response.data.items ?? []).map(toSearchProduct),
        total: response.data.total ?? 0, page: response.data.page ?? 1 } satisfies SearchPage<SearchProduct>;
    }));
  }

  facets(kind: 'category' | 'brand', search = '', page = 1) {
    return this.api.apiV1PosProductsFacetsGet({ Kind: kind, Search: search, Page: page, PageSize: 20 })
      .pipe(map(response => {
        if (!response.success || !response.data) throw new Error('No pudimos consultar los filtros.');
        return { items: (response.data.items ?? []).map(x => ({ id: x.id ?? '', name: x.name ?? '' })),
          total: response.data.total ?? 0, page } satisfies SearchPage<ProductFacet>;
      }));
  }

  favorite(product: SearchProduct) {
    return this.api.apiV1PosProductsProductIdFavoritePut({ productId: product.id, body: { favorite: !product.favorite } });
  }
}

export function toSearchProduct(dto: PosProductResponse): SearchProduct {
  if (!dto.id || dto.price == null || dto.availableStock == null) throw new Error('El producto no tiene precio o existencia válidos.');
  return { id: dto.id, name: dto.name ?? '', sku: dto.sku ?? '', barcode: dto.barcode ?? '',
    price: dto.price, availableStock: dto.availableStock, minimumStock: dto.minimumStock ?? 0,
    categoryId: dto.categoryId ?? '', categoryName: dto.categoryName ?? '', brandId: dto.brandId ?? '',
    brandName: dto.brandName ?? '', favorite: dto.favorite ?? false, soldQuantity: dto.soldQuantity ?? 0 };
}
