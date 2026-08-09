import { Routes } from '@angular/router';
import { BusinessWorkspacePage } from './business-workspace/business-workspace.page';

export const OPERATIONS_ROUTES: Routes = [
  {
    path: 'security',
    component: BusinessWorkspacePage,
    data: {
      moduleKey: 'F01',
      title: 'Usuarios, roles y permisos',
      description: 'Administración de acceso y responsabilidades.',
    },
  },
  {
    path: 'counter-sales',
    loadComponent: () =>
      import('./counter-sales/pages/counter-sales.page').then((m) => m.CounterSalesPage),
  },
  {
    path: 'inventory',
    component: BusinessWorkspacePage,
    data: {
      moduleKey: 'F03',
      title: 'Inventario',
      description: 'Existencias, kardex, ajustes y transferencias.',
    },
  },
  {
    path: 'purchases',
    component: BusinessWorkspacePage,
    data: {
      moduleKey: 'F04',
      title: 'Compras y recepciones',
      description: 'Órdenes de compra y recepción de mercancía.',
    },
  },
  {
    path: 'receivables',
    component: BusinessWorkspacePage,
    data: {
      moduleKey: 'F06',
      title: 'Cuentas por cobrar',
      description: 'Saldos, estados de cuenta y pagos de clientes.',
    },
  },
  {
    path: 'masters',
    redirectTo: '/masters',
    pathMatch: 'full',
  },
  {
    path: 'reports',
    component: BusinessWorkspacePage,
    data: {
      moduleKey: 'F08',
      title: 'Reportes',
      description: 'Ventas, utilidad, inventario, compras y antigüedad de saldos.',
    },
  },
  {
    path: 'audit',
    component: BusinessWorkspacePage,
    data: {
      moduleKey: 'F07',
      title: 'Auditoría y soporte',
      description: 'Actividad, errores, eventos y trazabilidad de cambios.',
    },
  },
  {
    path: 'administration/payment-terminals',
    loadComponent: () =>
      import('./payment-terminals/pages/payment-terminals.page').then(
        (m) => m.PaymentTerminalsPage,
      ),
  },
  {
    path: 'administration',
    component: BusinessWorkspacePage,
    data: {
      moduleKey: 'F09',
      title: 'Administración',
      description: 'Usuarios, roles, configuración, folios, métodos y políticas.',
    },
  },
];
