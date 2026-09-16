import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F04_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f04-purchase', moduleId: 'F04', version: 2, route: '/operations/purchases', estimatedMinutes: 7, featured: true,
    requiredPermissions: ['purchases.view', 'purchases.create'], title: copy('Cómo crear una compra', 'How to create a purchase'),
    description: copy('Proceso completo: proveedor, productos, cantidades, costos, confirmación y recepción posterior.', 'Complete process: supplier, products, quantities, costs, confirmation, and the later receipt.'),
    steps: [
      step('goal', S.moduleTaskNav, copy('Objetivo y diferencia importante', 'Goal and key distinction'), copy('Crear una compra documenta lo pedido al proveedor. La existencia aumenta después, al registrar y cerrar la recepción de mercancía.', 'Creating a purchase records what was ordered from the supplier. Stock increases later, when the receipt is recorded and closed.')),
      step('task', S.moduleTaskNav, copy('1. Elige “Registrar compra”', '1. Choose “Register purchase”'), copy('En las tareas de Compras selecciona el alta de compra. No elijas Recepción hasta que la mercancía haya llegado.', 'In Purchasing tasks, choose purchase registration. Do not choose Receipt until the goods have arrived.')),
      step('status', S.moduleTaskPanel, copy('2. Comprueba el estado', '2. Check the status'), copy('Una compra nueva inicia como borrador. Solo los borradores se pueden corregir; confirmado, cerrado y cancelado tienen reglas distintas.', 'A new purchase starts as a draft. Only drafts can be corrected; confirmed, closed, and canceled each follow different rules.')),
      step('supplier', S.moduleForm, copy('3. Selecciona el proveedor', '3. Select the supplier'), copy('Busca y confirma el proveedor correcto. Revisa que esté activo y que corresponda a la cotización o documento recibido.', 'Find and confirm the correct supplier. Verify that it is active and matches the quotation or document received.'), { optional: true }),
      step('warehouse', S.moduleForm, copy('4. Define destino y referencia', '4. Set destination and reference'), copy('Selecciona el almacén destino y captura fecha, referencia o notas requeridas. Esto facilita rastrear la compra y recibirla correctamente.', 'Select the destination warehouse and enter the required date, reference, or notes. This makes the purchase traceable and easier to receive correctly.'), { optional: true }),
      step('products', S.moduleForm, copy('5. Agrega los productos', '5. Add products'), copy('Busca cada SKU, confirma la unidad y evita líneas duplicadas. Si el producto no existe, primero debe darse de alta en Catálogos.', 'Find each SKU, confirm its unit, and avoid duplicate lines. If an item does not exist, register it in Catalogs first.'), { optional: true }),
      step('quantities', S.moduleForm, copy('6. Captura cantidad y costo', '6. Enter quantity and cost'), copy('Usa la cantidad solicitada y el costo acordado. Revisa decimales, impuestos y subtotal contra la cotización del proveedor.', 'Use the requested quantity and agreed cost. Check decimals, taxes, and subtotal against the supplier quotation.'), { optional: true }),
      step('review', S.moduleForm, copy('7. Revisa antes de guardar', '7. Review before saving'), copy('Compara proveedor, almacén, productos, cantidades, costos y total. Corrige cualquier marca de validación.', 'Compare supplier, warehouse, products, quantities, costs, and total. Fix any validation marker.'), { optional: true }),
      step('confirm', S.moduleAction, copy('8. Guarda o confirma', '8. Save or confirm'), copy('Guardar conserva el borrador; confirmar formaliza la compra. Ejecuta una sola vez y espera la respuesta. El tutorial no enviará la operación.', 'Save keeps a draft; confirm formalizes the purchase. Run it once and wait for the response. The tour never submits the operation.'), { optional: true }),
      step('result', S.moduleResults, copy('9. Conserva folio y estado', '9. Keep the reference and status'), copy('Verifica el folio devuelto por el servidor. Cuando llegue la mercancía, abre “Recibir mercancía”, captura lo recibido y cierra la recepción para impactar inventario.', 'Verify the server reference. When goods arrive, open “Receive goods,” enter what arrived, and close the receipt to update inventory.'), { optional: true }),
    ],
  },
  {
    id: 'f04-receipt', moduleId: 'F04', version: 1, route: '/operations/purchases', estimatedMinutes: 4,
    requiredPermissions: ['purchases.view', 'purchases.create', 'goods_receipts.close'], title: copy('Recibir mercancía', 'Receive goods'),
    description: copy('Captura cantidades recibidas y comprende cuándo impactan al inventario.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Tareas de recepción', 'Receipt tasks'), copy('Elige registrar, consultar, cerrar o cancelar una recepción según su estado.')),
      step('panel', S.moduleTaskPanel, copy('Recepción correcta', 'Correct receipt'), copy('Verifica compra de origen y almacén destino antes de capturar productos.')),
      step('form', S.moduleForm, copy('Cantidades recibidas', 'Received quantities'), copy('Registra lo que llegó realmente y revisa diferencias contra lo pedido.'), { optional: true }),
      step('action', S.moduleAction, copy('Cerrar recepción', 'Close receipt'), copy('Cerrar puede sumar existencias. Lee el resumen y espera la confirmación del servidor; este tutorial no lo ejecuta.'), { optional: true }),
      step('results', S.moduleResults, copy('Resultado e inventario', 'Result and inventory'), copy('Verifica el estado final y consulta inventario o kardex para confirmar el impacto.'), { optional: true }),
    ],
  },
];
