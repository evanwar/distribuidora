import { Routes } from '@angular/router';
import { EntityResourceDefinition } from '../../shared/patterns/entity-manager/entity-manager.models';

const resource: EntityResourceDefinition = {
  module: 'F02 · Proveedores',
  title: 'Proveedores',
  description: 'Contactos y datos de quienes abastecen el negocio.',
  singular: 'proveedor',
  listEndpoint: '/api/v1/suppliers',
  createEndpoint: '/api/v1/suppliers',
  updateEndpoint: '/api/v1/suppliers/{id}',
  fields: [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'contactName', label: 'Contacto', type: 'text' },
    { key: 'phone', label: 'Teléfono', type: 'text' },
    { key: 'email', label: 'Correo', type: 'email' },
    { key: 'address', label: 'Dirección', type: 'text', table: false },
    { key: 'active', label: 'Proveedor activo', type: 'boolean', defaultValue: true },
  ],
};

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/patterns/entity-manager/entity-manager.page').then(
        (m) => m.EntityManagerPage,
      ),
    data: { resource },
  },
];
