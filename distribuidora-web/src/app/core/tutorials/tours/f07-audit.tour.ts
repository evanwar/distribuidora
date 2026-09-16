import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F07_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f07-audit', moduleId: 'F07', version: 1, route: '/operations/audit', estimatedMinutes: 4,
    requiredPermissions: ['audit.view', 'logs.audit.read', 'logs.activity.read'], title: copy('Consultar auditoría', 'Review audit trail'),
    description: copy('Identifica quién cambió qué, cuándo y por qué.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Fuentes de auditoría', 'Audit sources'), copy('Consulta actividad, cambios por entidad, eventos y errores operativos.')),
      step('panel', S.moduleTaskPanel, copy('Consulta trazable', 'Traceable query'), copy('Selecciona la consulta y revisa su alcance antes de aplicar filtros.')),
      step('form', S.moduleForm, copy('Filtra la evidencia', 'Filter evidence'), copy('Acota por usuario, entidad, acción, fecha o referencia cuando estén disponibles.'), { optional: true }),
      step('results', S.moduleResults, copy('Detalle humano', 'Human-readable detail'), copy('Revisa primero actor, fecha, acción y motivo. El detalle técnico queda como apoyo avanzado.'), { optional: true }),
    ],
  },
  {
    id: 'f07-errors-cancellations', moduleId: 'F07', version: 1, route: '/operations/audit', estimatedMinutes: 3,
    requiredPermissions: ['audit.view', 'sales.cancel'], title: copy('Errores y cancelaciones', 'Errors and cancellations'),
    description: copy('Usa referencias de soporte y comprende las consecuencias de cancelar.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Soporte operativo', 'Operational support'), copy('Abre la bandeja de errores o el catálogo de motivos según el caso.')),
      step('panel', S.moduleTaskPanel, copy('Contexto antes de actuar', 'Context before action'), copy('Lee estado, referencia y recuperación recomendada.')),
      step('form', S.moduleForm, copy('Motivo obligatorio', 'Required reason'), copy('Una cancelación exige un motivo claro y muestra sus consecuencias. El tutorial nunca cancela documentos.'), { optional: true }),
      step('results', S.moduleResults, copy('Confirma el estado', 'Confirm the status'), copy('No asumas éxito: espera el estado devuelto por el servidor y conserva la referencia de soporte.'), { optional: true }),
    ],
  },
];
