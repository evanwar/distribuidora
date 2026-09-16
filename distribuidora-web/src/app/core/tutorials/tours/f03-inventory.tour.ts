import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F03_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f03-inventory-query', moduleId: 'F03', version: 1, route: '/operations/inventory', estimatedMinutes: 4,
    requiredPermissions: ['inventory.view'], title: copy('Consultar inventario', 'Review inventory'),
    description: copy('Consulta existencias, kardex y productos con stock bajo.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Consultas disponibles', 'Available queries'), copy('Selecciona existencias, kardex o stock bajo según la pregunta que necesitas responder.')),
      step('panel', S.moduleTaskPanel, copy('Filtros de consulta', 'Query filters'), copy('El panel explica la consulta y solicita producto, almacén o fechas cuando corresponde.')),
      step('form', S.moduleForm, copy('Acota la información', 'Narrow the information'), copy('Usa filtros para consultar datos precisos sin cargar el catálogo completo.'), { optional: true }),
      step('action', S.moduleAction, copy('Actualizar', 'Refresh'), copy('Ejecuta una consulta de lectura. Las cantidades mostradas son las recibidas del servidor.'), { optional: true }),
      step('results', S.moduleResults, copy('Existencia real', 'Current balance'), copy('Compara almacén, producto y cantidades. Los estados negativos o bajos incluyen texto, no solo color.'), { optional: true }),
    ],
  },
  {
    id: 'f03-adjustments', moduleId: 'F03', version: 1, route: '/operations/inventory', estimatedMinutes: 4,
    requiredPermissions: ['inventory.adjust'], title: copy('Kardex y ajustes', 'Kardex and adjustments'),
    description: copy('Entiende movimientos y el proceso seguro para corregir una existencia.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Elige la tarea', 'Choose the task'), copy('Consulta movimientos o inicia un ajuste solo cuando tengas autorización y evidencia.')),
      step('panel', S.moduleTaskPanel, copy('Movimiento auditable', 'Auditable movement'), copy('Cada movimiento conserva tipo, fecha, referencia y actor para su seguimiento.')),
      step('form', S.moduleForm, copy('Motivo y cantidades', 'Reason and quantities'), copy('Un ajuste exige almacén, productos, existencia física y motivo. El tutorial no modificará inventario.'), { optional: true }),
      step('action', S.moduleAction, copy('Confirma con cuidado', 'Confirm carefully'), copy('Guardar prepara la operación; confirmar aplica el cambio real. Nunca repitas una confirmación ante una respuesta incierta.'), { optional: true }),
      step('results', S.moduleResults, copy('Saldo confirmado', 'Confirmed balance'), copy('Después de aplicar, revisa la respuesta y vuelve a consultar la existencia real.'), { optional: true }),
    ],
  },
];
