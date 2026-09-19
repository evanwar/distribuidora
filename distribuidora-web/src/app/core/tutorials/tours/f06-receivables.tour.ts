import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F06_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f06-portfolio', moduleId: 'F06', version: 1, route: '/operations/receivables', estimatedMinutes: 4,
    requiredPermissions: ['receivables.view'], title: copy('Consultar cartera', 'Review receivables'),
    description: copy('Revisa quién debe, cuánto debe y cuándo debe pagar.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('¿Qué quieres consultar?', 'Collection queries'), copy('Elige la lista de adeudos, el detalle de un cobro o el estado de cuenta de un cliente.')),
      step('panel', S.moduleTaskPanel, copy('De dónde viene la deuda', 'Balance source'), copy('Aquí puedes ver qué venta generó el adeudo y si sigue pendiente, ya venció o fue pagado.')),
      step('form', S.moduleForm, copy('Filtros útiles', 'Useful filters'), copy('Filtra por cliente, vencimiento o estado para concentrarte en la acción necesaria.'), { optional: true }),
      step('results', S.moduleResults, copy('Vigente, vencido o pagado', 'Current, overdue, or paid'), copy('El estado se comunica con texto e icono. El saldo mostrado es el confirmado por el servidor.'), { optional: true }),
    ],
  },
  {
    id: 'f06-payment', moduleId: 'F06', version: 1, route: '/operations/receivables', estimatedMinutes: 4,
    requiredPermissions: ['receivables.register_payment', 'receivables.apply_payment'], title: copy('Registrar un pago', 'Register a payment'),
    description: copy('Aprende a registrar un pago y a comprobar que se descontó correctamente.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Tareas de pago', 'Payment tasks'), copy('Registra primero el pago y aplica después su distribución cuando el flujo lo solicite.')),
      step('panel', S.moduleTaskPanel, copy('Revisa la cuenta', 'Review the account'), copy('Comprueba cliente, documentos y saldo antes de capturar.')),
      step('form', S.moduleForm, copy('Indica cuánto pagó', 'Amount and allocation'), copy('Escribe el importe y elige las deudas que se pagarán con ese dinero. El sistema revisará que la suma sea correcta.'), { optional: true }),
      step('action', S.moduleAction, copy('Evita duplicados', 'Prevent duplicates'), copy('Los pagos no se reintentan automáticamente. Espera el resultado antes de volver a actuar; el tutorial no enviará nada.'), { optional: true }),
      step('results', S.moduleResults, copy('Saldo actualizado', 'Updated balance'), copy('Revisa saldo antes y después, estado y referencia del resultado confirmado.'), { optional: true }),
    ],
  },
];
