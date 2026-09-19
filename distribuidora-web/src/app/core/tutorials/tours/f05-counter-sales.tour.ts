import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

const route = '/operations/counter-sales';
const permissions = ['sales.view', 'sales.create'];

export const F05_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f05-prepare-sale', moduleId: 'F05', version: 1, route, estimatedMinutes: 5, requiredPermissions: permissions,
    title: copy('Preparar una venta', 'Prepare a sale'), description: copy('Elige al cliente, agrega los productos y revisa que todo esté bien.'),
    steps: [
      step('header', S.posHeader, copy('Aquí comienzas la venta', 'Point of sale'), copy('En esta pantalla prepararás la venta. Este recorrido solo te orienta: no agregará productos ni guardará cambios.')),
      step('customer', S.posCustomer, copy('Elige al cliente', 'Customer and terms'), copy('Búscalo por nombre o celular. Si la venta será a crédito, debes seleccionar un cliente autorizado.')),
      step('search', S.posProductSearch, copy('Encuentra un producto', 'Find products'), copy('Escribe su nombre, código interno o código de barras. Si tienes un lector, también puedes escanearlo.')),
      step('results', S.posProductResults, copy('Revisa antes de agregar', 'Availability'), copy('Confirma el nombre, el precio y la cantidad disponible del producto.'), { optional: true }),
      step('cart', S.posCart, copy('Carrito de venta', 'Sale cart'), copy('Aquí cambias cantidades o retiras líneas. Un error recuperable conserva el borrador.'), { placement: 'top' }),
      step('totals', S.posTotals, copy('Revisa el total', 'Preview totals'), copy('Aquí verás cuánto pagará el cliente. El monto final se confirmará al cobrar.'), { placement: 'left' }),
    ],
  },
  {
    id: 'f05-card-payment', moduleId: 'F05', version: 1, route, estimatedMinutes: 6, featured: true,
    requiredPermissions: ['sales.confirm', 'sales.register_payment'],
    title: copy('Cobrar con tarjeta', 'How to take a card payment'),
    description: copy('Revisa el total, elige la terminal y espera la confirmación del cobro.', 'Complete process: verify the total, choose card and terminal, start payment, and confirm its result.'),
    steps: [
      step('prerequisite', S.posCart, copy('Antes de cobrar', 'Before charging'), copy('Confirma que el carrito tenga los productos y cantidades correctos, y que el cliente corresponda cuando la venta lo requiera. Un cobro aprobado no debe duplicarse.', 'Confirm that the cart has the correct items and quantities, and that the customer is correct when required. An approved charge must never be duplicated.'), { placement: 'top' }),
      step('total', S.posTotals, copy('1. Valida el total', '1. Verify the total'), copy('Compara subtotal, impuestos y total con la venta. Si algo no coincide, corrige el carrito antes de acercar la tarjeta.', 'Compare subtotal, taxes, and total with the sale. If anything differs, correct the cart before presenting the card.'), { placement: 'left' }),
      step('method', S.posPaymentMethod, copy('2. Selecciona tarjeta', '2. Select card'), copy('En “Forma de pago” elige la opción de tarjeta o terminal. No uses una referencia manual si el cobro debe procesarse en la terminal integrada.', 'Under “Payment method,” choose card or terminal. Do not use a manual reference when the payment must be processed by the integrated terminal.'), { placement: 'left' }),
      step('terminal', S.posPaymentMethod, copy('3. Elige la terminal activa', '3. Choose an active terminal'), copy('Selecciona la terminal física que usarás. Si no aparece ninguna, no continúes: solicita su alta o reactivación en Administración.', 'Select the physical terminal you will use. If none appears, stop and ask for it to be registered or reactivated in Administration.'), { placement: 'left' }),
      step('customer', S.posCustomer, copy('4. Avisa al cliente', '4. Inform the customer'), copy('Indica el importe que verá en la terminal y pide que acerque, inserte o deslice su tarjeta según lo solicite el dispositivo.', 'Tell the customer the amount shown on the terminal and ask them to tap, insert, or swipe as instructed by the device.')),
      step('charge', S.posChargeAction, copy('5. Inicia “Cobrar en terminal”', '5. Start “Charge on terminal”'), copy('Presiona una sola vez. La venta queda esperando la respuesta de la terminal; no recargues la página ni abras otro cobro mientras está pendiente.', 'Press once. The sale waits for the terminal response; do not reload the page or start another charge while it is pending.'), { placement: 'left' }),
      step('terminal-response', S.posChargeAction, copy('6. Espera el resultado', '6. Wait for the result'), copy('Aprobado: continúa al comprobante. Rechazado: informa al cliente y usa otro medio. Pendiente: consulta el estado; nunca repitas el cargo sin confirmar.', 'Approved: continue to the receipt. Declined: inform the customer and use another method. Pending: check status; never repeat the charge without confirming.'), { placement: 'left' }),
      step('receipt', S.posChargeAction, copy('7. Confirma venta y comprobante', '7. Confirm sale and receipt'), copy('Verifica folio de venta, importe y pago aprobado antes de entregar mercancía. Conserva o entrega el comprobante que genera el sistema.', 'Verify the sale reference, amount, and approved payment before handing over goods. Keep or provide the receipt generated by the system.'), { placement: 'left' }),
      step('exception', S.posChargeAction, copy('8. Si hubo una interrupción', '8. If interrupted'), copy('Consulta el historial y el estado del cobro antes de intentar de nuevo. Si la terminal cobró pero la venta no avanzó, no hagas un segundo cargo: escala el caso con el folio.', 'Check history and payment status before retrying. If the terminal charged but the sale did not advance, do not charge again; escalate using the reference.'), { placement: 'left' }),
    ],
  },
  {
    id: 'f05-checkout', moduleId: 'F05', version: 1, route, estimatedMinutes: 5, requiredPermissions: ['sales.confirm', 'sales.register_payment'],
    title: copy('Cobrar una venta', 'Take payment'), description: copy('Elige cómo pagará el cliente, calcula el cambio y confirma el cobro.'),
    steps: [
      step('totals', S.posTotals, copy('Total a cobrar', 'Amount due'), copy('Confirma el total pendiente antes de elegir una forma de pago.'), { placement: 'left' }),
      step('method', S.posPaymentMethod, copy('¿Cómo pagará?', 'Payment method'), copy('Elige efectivo, tarjeta u otra opción disponible. Algunas ventas también pueden permitir crédito o combinar pagos.'), { placement: 'left' }),
      step('cash', S.posCashTendered, copy('Efectivo recibido', 'Cash received'), copy('Captura lo entregado por el cliente. Si es insuficiente, la confirmación permanece bloqueada.'), { placement: 'left', optional: true }),
      step('change', S.posChange, copy('Entrega este cambio', 'Change due'), copy('Confirma el monto en pantalla antes de entregar el cambio al cliente.'), { placement: 'left', optional: true }),
      step('charge', S.posChargeAction, copy('Cobrar y confirmar', 'Charge and confirm'), copy('Esta acción se protege contra doble envío. El tutorial no confirmará la venta ni registrará pagos.'), { placement: 'left' }),
    ],
  },
  {
    id: 'f05-after-sale', moduleId: 'F05', version: 1, route, estimatedMinutes: 4, requiredPermissions: ['sales.view'],
    title: copy('Después de vender', 'After a sale'), description: copy('Consulta historial, detalle, comprobante y acciones posteriores.'),
    steps: [
      step('header', S.posHeader, copy('Cambia de vista', 'Switch views'), copy('Usa Ver historial para consultar operaciones anteriores y Nueva venta para volver al mostrador.')),
      step('history', S.posHistory, copy('Historial de ventas', 'Sales history'), copy('Busca por folio, cliente, producto, estado o periodo. Desde aquí puedes abrir el detalle.'), { optional: true }),
      step('content', S.pageContent, copy('Folio y estado reales', 'Confirmed reference and status'), copy('El detalle y el comprobante usan la información confirmada por el servidor. Cancelar exige permiso y motivo.')),
    ],
  },
];
