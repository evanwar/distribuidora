import { Routes } from '@angular/router';
import { EntityResourceDefinition } from '../../shared/patterns/entity-manager/entity-manager.models';

const resource: EntityResourceDefinition = {
  module: 'F02 · Productos',
  title: 'Productos',
  description: 'SKU, precios y clasificación comercial.',
  singular: 'producto',
  listEndpoint: '/api/v1/products',
  createEndpoint: '/api/v1/products',
  updateEndpoint: '/api/v1/products/{id}',
  detailEndpoint: '/api/v1/products/{id}',
  paged: true,
  pageSize: 25,
  fields: [
    { key: 'sku', label: 'SKU', type: 'text', required: true },
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'barcode', label: 'Código de barras', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text', table: false },
    {
      key: 'categoryId',
      label: 'Categoría',
      type: 'select',
      required: true,
      table: false,
      optionsEndpoint: '/api/v1/categories',
    },
    {
      key: 'brandId',
      label: 'Marca',
      type: 'select',
      required: true,
      table: false,
      optionsEndpoint: '/api/v1/brands',
    },
    {
      key: 'unitId',
      label: 'Unidad',
      type: 'select',
      required: true,
      table: false,
      optionsEndpoint: '/api/v1/units',
    },
    { key: 'cost', label: 'Costo', type: 'number' },
    { key: 'basePrice', label: 'Precio base', type: 'number' },
    { key: 'minimumStock', label: 'Stock mínimo', type: 'number', table: false },
    { key: 'active', label: 'Producto activo', type: 'boolean', defaultValue: true },
  ],
};

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/patterns/entity-manager/entity-manager.page').then(
        (m) => m.EntityManagerPage,
      ),
    data: { resource },
  },
];
