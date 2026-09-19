import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F03_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f03-inventory-query', moduleId: 'F03', version: 1, route: '/operations/inventory', estimatedMinutes: 4,
    requiredPermissions: ['inventory.view'], title: copy('Consultar inventario', 'Review inventory'),
    description: copy('Revisa cuántos productos hay y cuáles están por terminarse.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('¿Qué quieres revisar?', 'Available queries'), copy('Elige Existencias para ver cantidades, Movimientos para saber qué cambió o Stock bajo para encontrar lo que debe reponerse.')),
      step('panel', S.moduleTaskPanel, copy('Elige qué buscar', 'Query filters'), copy('Puedes indicar un producto, una sucursal o un periodo para encontrar la información que necesitas.')),
      step('form', S.moduleForm, copy('Haz una búsqueda sencilla', 'Narrow the information'), copy('Completa solo los datos que conozcas. Entre más detalles agregues, más preciso será el resultado.'), { optional: true }),
      step('action', S.moduleAction, copy('Actualizar', 'Refresh'), copy('Ejecuta una consulta de lectura. Las cantidades mostradas son las recibidas del servidor.'), { optional: true }),
      step('results', S.moduleResults, copy('Revisa las cantidades', 'Current balance'), copy('Confirma que sea el producto y la sucursal correctos. El sistema te avisará si hay poco producto o si la cantidad es negativa.'), { optional: true }),
    ],
  },
  {
    id: 'f03-adjustments', moduleId: 'F03', version: 1, route: '/operations/inventory', estimatedMinutes: 4,
    requiredPermissions: ['inventory.adjust'], title: copy('Kardex y ajustes', 'Kardex and adjustments'),
    description: copy('Consulta cambios y aprende a corregir una cantidad de forma segura.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Elige la tarea', 'Choose the task'), copy('Consulta movimientos o inicia un ajuste solo cuando tengas autorización y evidencia.')),
      step('panel', S.moduleTaskPanel, copy('Cada cambio queda registrado', 'Auditable movement'), copy('Podrás ver qué cambió, cuándo ocurrió y quién lo hizo.')),
      step('form', S.moduleForm, copy('Motivo y cantidades', 'Reason and quantities'), copy('Un ajuste exige almacén, productos, existencia física y motivo. El tutorial no modificará inventario.'), { optional: true }),
      step('action', S.moduleAction, copy('Revisa antes de confirmar', 'Confirm carefully'), copy('Guardar deja el ajuste pendiente. Confirmar cambia la cantidad real. Si no ves una respuesta clara, revisa el resultado antes de intentarlo otra vez.'), { optional: true }),
      step('results', S.moduleResults, copy('Saldo confirmado', 'Confirmed balance'), copy('Después de aplicar, revisa la respuesta y vuelve a consultar la existencia real.'), { optional: true }),
    ],
  },
];
