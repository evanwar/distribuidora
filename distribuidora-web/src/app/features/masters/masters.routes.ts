import { Routes } from '@angular/router';
import { EntityResourceDefinition } from '../../shared/patterns/entity-manager/entity-manager.models';

const namedFields = [
  { key: 'name', label: 'Nombre', type: 'text', required: true },
  { key: 'description', label: 'Descripción', type: 'text' },
  { key: 'active', label: 'Activo', type: 'boolean', defaultValue: true },
] as const;

const categories: EntityResourceDefinition = {
  module: 'F02 · Categorías',
  title: 'Categorías',
  description: 'Clasificación principal del catálogo de productos.',
  singular: 'categoría',
  listEndpoint: '/api/v1/categories',
  createEndpoint: '/api/v1/categories',
  updateEndpoint: '/api/v1/categories/{id}',
  fields: namedFields,
};

const brands: EntityResourceDefinition = {
  module: 'F02 · Marcas',
  title: 'Marcas',
  description: 'Marcas comerciales asociadas a productos.',
  singular: 'marca',
  listEndpoint: '/api/v1/brands',
  createEndpoint: '/api/v1/brands',
  updateEndpoint: '/api/v1/brands/{id}',
  fields: namedFields,
};

const units: EntityResourceDefinition = {
  module: 'F02 · Unidades',
  title: 'Unidades',
  description: 'Unidades de medida y manejo de cantidades decimales.',
  singular: 'unidad',
  listEndpoint: '/api/v1/units',
  createEndpoint: '/api/v1/units',
  updateEndpoint: '/api/v1/units/{id}',
  fields: [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'abbreviation', label: 'Abreviatura', type: 'text', required: true },
    { key: 'allowsDecimals', label: 'Permite decimales', type: 'boolean' },
    { key: 'active', label: 'Activa', type: 'boolean', defaultValue: true },
  ],
};

const warehouses: EntityResourceDefinition = {
  module: 'F02 · Almacenes',
  title: 'Almacenes',
  description: 'Ubicaciones centrales disponibles para inventario.',
  singular: 'almacén',
  listEndpoint: '/api/v1/warehouses',
  createEndpoint: '/api/v1/warehouses',
  updateEndpoint: '/api/v1/warehouses/{id}',
  fields: [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 0, label: 'Central' },
        { value: 1, label: 'Secundario' },
      ],
    },
    { key: 'active', label: 'Activo', type: 'boolean', defaultValue: true },
  ],
};

const aliases: EntityResourceDefinition = {
  module: 'F02 · Productos',
  title: 'Aliases de producto',
  description: 'Códigos de búsqueda alternos para agilizar la venta.',
  singular: 'alias',
  listEndpoint: '/api/v1/product-aliases',
  createEndpoint: '/api/v1/product-aliases',
  updateEndpoint: '/api/v1/product-aliases/{id}',
  fields: [
    {
      key: 'productId',
      label: 'Producto',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/v1/products',
      optionLabelKey: 'name',
      optionSecondaryKey: 'sku',
    },
    { key: 'alias', label: 'Alias', type: 'text', required: true },
    { key: 'active', label: 'Activo', type: 'boolean', defaultValue: true },
  ],
};

const manager = () =>
  import('../../shared/patterns/entity-manager/entity-manager.page').then(
    (m) => m.EntityManagerPage,
  );

export const MASTERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/masters-hub.page').then((m) => m.MastersHubPage),
  },
  { path: 'categories', loadComponent: manager, data: { resource: categories } },
  { path: 'brands', loadComponent: manager, data: { resource: brands } },
  { path: 'units', loadComponent: manager, data: { resource: units } },
  { path: 'warehouses', loadComponent: manager, data: { resource: warehouses } },
  { path: 'product-aliases', loadComponent: manager, data: { resource: aliases } },
];
