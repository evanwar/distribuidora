import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

const route = '/operations/administration';

export const F09_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f09-settings-folios', moduleId: 'F09', version: 1, route, estimatedMinutes: 4,
    requiredPermissions: ['admin.view', 'admin.configure', 'admin.manage_folios'], title: copy('Configuración y folios', 'Settings and folios'),
    description: copy('Mantén parámetros permitidos y secuencias con control de cambios.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Opciones administrativas', 'Administration options'), copy('Elige configuración, folios, métodos, políticas o trazabilidad.')),
      step('panel', S.moduleTaskPanel, copy('Parámetros disponibles', 'Available settings'), copy('Solo puedes modificar claves expuestas por el servidor. No se guardan secretos en el navegador.')),
      step('form', S.moduleForm, copy('Edita con contexto', 'Edit with context'), copy('Revisa valor, propósito y versión antes de cambiar configuración o una secuencia.'), { optional: true }),
      step('action', S.moduleAction, copy('Cambio crítico', 'Critical change'), copy('Confirma conscientemente. Si existe conflicto, recarga y revisa antes de repetir; el tutorial no guarda.'), { optional: true }),
      step('results', S.moduleResults, copy('Configuración vigente', 'Current settings'), copy('Comprueba la versión y el resultado confirmado por el servidor.'), { optional: true }),
    ],
  },
  {
    id: 'f09-payment-terminals', moduleId: 'F09', version: 1, route: '/operations/administration/payment-terminals', estimatedMinutes: 3,
    requiredPermissions: ['admin.view', 'admin.manage_payment_methods', 'admin.view_payment_terminals', 'admin.manage_payment_terminals'], title: copy('Métodos y terminales', 'Methods and terminals'),
    description: copy('Administra terminales activas y la selección predeterminada.'),
    steps: [
      step('header', S.pageHeader, copy('Terminales de pago', 'Payment terminals'), copy('Aquí se controlan los dispositivos disponibles para cobrar con tarjeta.')),
      step('action', S.paymentTerminalsAction, copy('Nueva terminal', 'New terminal'), copy('Registra nombre e identificador externo. El tutorial no abrirá ni guardará el formulario.')),
      step('list', S.paymentTerminalsList, copy('Estado y predeterminada', 'Status and default'), copy('Revisa cuál está activa y cuál se selecciona automáticamente en el punto de venta.'), { optional: true }),
      step('content', S.pageContent, copy('Activar o desactivar', 'Activate or deactivate'), copy('Una terminal con cobro activo puede producir un conflicto. Revisa el mensaje antes de volver a intentar.')),
    ],
  },
  {
    id: 'f09-policies-trace', moduleId: 'F09', version: 1, route, estimatedMinutes: 4,
    requiredPermissions: ['admin.view', 'logs.trace.read'], title: copy('Políticas y trazabilidad', 'Policies and traceability'),
    description: copy('Consulta reglas operativas y sigue una operación por su referencia.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Políticas y trazas', 'Policies and traces'), copy('Elige política de crédito, política de inventario o una búsqueda de trazabilidad.')),
      step('panel', S.moduleTaskPanel, copy('Fuente autoritativa', 'Authoritative source'), copy('Las políticas mostradas son las vigentes en el servidor y afectan operaciones posteriores.')),
      step('form', S.moduleForm, copy('Busca una referencia', 'Find a reference'), copy('Usa operación, referencia de soporte, folio o evento según la tarea elegida.'), { optional: true }),
      step('results', S.moduleResults, copy('Línea de seguimiento', 'Trace timeline'), copy('Revisa eventos y estados en orden para entender qué ocurrió sin exponer datos sensibles.'), { optional: true }),
    ],
  },
];
