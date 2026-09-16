import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F06_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f06-portfolio', moduleId: 'F06', version: 1, route: '/operations/receivables', estimatedMinutes: 4,
    requiredPermissions: ['receivables.view'], title: copy('Consultar cartera', 'Review receivables'),
    description: copy('Encuentra saldos, vencimientos y estados de cuenta.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Consultas de cobranza', 'Collection queries'), copy('Elige cartera, detalle o estado de cuenta según el seguimiento requerido.')),
      step('panel', S.moduleTaskPanel, copy('Origen del saldo', 'Balance source'), copy('Cada cuenta debe indicar la venta que originó el adeudo y su estado actual.')),
      step('form', S.moduleForm, copy('Filtros útiles', 'Useful filters'), copy('Filtra por cliente, vencimiento o estado para concentrarte en la acción necesaria.'), { optional: true }),
      step('results', S.moduleResults, copy('Vigente, vencido o pagado', 'Current, overdue, or paid'), copy('El estado se comunica con texto e icono. El saldo mostrado es el confirmado por el servidor.'), { optional: true }),
    ],
  },
  {
    id: 'f06-payment', moduleId: 'F06', version: 1, route: '/operations/receivables', estimatedMinutes: 4,
    requiredPermissions: ['receivables.register_payment', 'receivables.apply_payment'], title: copy('Registrar un pago', 'Register a payment'),
    description: copy('Comprende el registro, aplicación y resultado de un pago de cliente.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Tareas de pago', 'Payment tasks'), copy('Registra primero el pago y aplica después su distribución cuando el flujo lo solicite.')),
      step('panel', S.moduleTaskPanel, copy('Revisa la cuenta', 'Review the account'), copy('Comprueba cliente, documentos y saldo antes de capturar.')),
      step('form', S.moduleForm, copy('Importe y aplicación', 'Amount and allocation'), copy('Captura el importe y las cuentas correspondientes. El sistema valida que la distribución sea permitida.'), { optional: true }),
      step('action', S.moduleAction, copy('Evita duplicados', 'Prevent duplicates'), copy('Los pagos no se reintentan automáticamente. Espera el resultado antes de volver a actuar; el tutorial no enviará nada.'), { optional: true }),
      step('results', S.moduleResults, copy('Saldo actualizado', 'Updated balance'), copy('Revisa saldo antes y después, estado y referencia del resultado confirmado.'), { optional: true }),
    ],
  },
];
