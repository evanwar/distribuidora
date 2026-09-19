import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F02_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f02-customers', moduleId: 'F02', version: 2, route: '/customers', estimatedMinutes: 6, featured: true,
    requiredPermissions: ['catalogs.view', 'catalogs.create', 'catalogs.edit'],
    title: copy('Agregar un cliente', 'How to register a customer'), description: copy('Aprende a buscarlo, escribir sus datos y guardar el nuevo registro.', 'Complete process: check for duplicates, enter the details, validate them, and confirm the new customer.'),
    steps: [
      step('goal', S.pageHeader, copy('Objetivo del proceso', 'Process goal'), copy('Al terminar tendrás un cliente disponible para ventas, crédito y facturación. El recorrido solo explica: no guardará información.', 'When finished, the customer will be available for sales, credit, and invoicing. This tour only explains the process and never saves data.')),
      step('search', S.customersSearch, copy('1. Primero, busca al cliente', '1. Check for duplicates'), copy('Busca por nombre, RFC, teléfono o correo. Si ya aparece, usa ese registro para no crear uno repetido.', 'Before creating one, search by name, tax ID, phone, and email. If it exists, open that record instead of creating a duplicate.')),
      step('review', S.customersList, copy('2. Revisa los resultados', '2. Review the results'), copy('Confirma que no sea la misma persona o empresa con una escritura diferente. Comprueba también si está activo.', 'Confirm it is not the same person or company with a different spelling, and check whether the record is active.'), { optional: true }),
      step('new', S.customersPrimaryAction, copy('3. Agrega un cliente', '3. Start registration'), copy('Selecciona “Nuevo cliente” para abrir el formulario. El recorrido te mostrará qué hacer, pero no guardará nada.', 'Choose “New customer” to open the form. This tour will not press the button or submit the form.')),
      step('identity', S.customersEditor, copy('4. Escribe sus datos principales', '4. Enter identity details'), copy('Agrega el nombre de la persona o empresa y el RFC, si corresponde. Escribe el nombre completo para encontrarlo fácilmente después.', 'Enter the name or legal business name and tax ID when applicable. Use accurate data and avoid abbreviations that make future searches harder.'), { optional: true }),
      step('contact', S.customersEditor, copy('5. Agrega datos de contacto', '5. Add contact details'), copy('Completa teléfono y correo. Revisa dígitos y dominio: estos datos se usarán para localizar al cliente y entregar comprobantes.', 'Complete the phone and email. Verify digits and domain because these details are used to contact the customer and deliver receipts.'), { optional: true }),
      step('commercial', S.customersEditor, copy('6. Revisa condiciones comerciales', '6. Review commercial terms'), copy('Si tu rol permite crédito, confirma límite, condición y estado. El servidor valida la autorización final.', 'If your role allows credit, confirm the limit, terms, and status. The server performs the final authorization.'), { optional: true }),
      step('save', S.customersEditor, copy('7. Valida y guarda', '7. Validate and save'), copy('Corrige los campos marcados, vuelve a revisar nombre, RFC y contacto, y selecciona “Crear cliente” una sola vez. Espera la confirmación antes de salir.', 'Fix highlighted fields, recheck the name, tax ID, and contact details, then choose “Create customer” once. Wait for confirmation before leaving.'), { optional: true }),
      step('result', S.customersList, copy('8. Confirma el resultado', '8. Confirm the result'), copy('Busca nuevamente al cliente y verifica que aparezca activo. Si no se confirmó el guardado, no repitas el alta sin comprobar primero.', 'Search again and verify that the customer appears as active. If saving was not confirmed, check first before trying again.'), { optional: true }),
    ],
  },
  {
    id: 'f02-products', moduleId: 'F02', version: 3, route: '/products', estimatedMinutes: 7, featured: true,
    requiredPermissions: ['catalogs.view', 'catalogs.create', 'catalogs.edit'],
    title: copy('Agregar un producto', 'How to register a product'), description: copy('Aprende a identificarlo, organizarlo, ponerle precio y guardar el registro.', 'Complete process: avoid duplicates, enter the SKU, classify the item, set prices, and validate the result.'),
    steps: [
      step('goal', S.pageHeader, copy('Objetivo del proceso', 'Process goal'), copy('El producto quedará disponible para compras, inventario y ventas. Necesitas tener listas su identificación, clasificación, unidad y precios.', 'The product will become available for purchasing, inventory, and sales. Have its identification, classification, unit, and prices ready.')),
      step('duplicates', S.entityList, copy('1. Verifica que no exista', '1. Check that it does not exist'), copy('Busca el SKU, código de barras y nombre. Si encuentras uno inactivo, revisa si corresponde reactivarlo en lugar de duplicarlo.', 'Search by SKU, barcode, and name. If you find an inactive item, check whether it should be reactivated instead of duplicated.'), { optional: true }),
      step('new', S.entityPrimaryAction, copy('2. Pulsa “Registrar producto”', '2. Choose “Register product”'), copy('El botón está en el encabezado de Productos y abre una captura limpia. El tutorial no lo accionará ni guardará cambios.', 'The button is in the Products header and opens a clean form. The tour will not press it or save changes.')),
      step('identity', S.entityEditor, copy('3. Escribe los datos del producto', '3. Identify the product'), copy('Agrega un código interno que no se repita, un nombre claro y el código de barras correcto. Si puedes, escanéalo para evitar errores.', 'Assign a unique SKU, a clear name, and the correct barcode. Scan or compare the code to avoid entry errors.'), { optional: true }),
      step('classification', S.entityEditor, copy('4. Indica cómo se organiza y vende', '4. Classify and set the unit'), copy('Elige su categoría, marca y si se maneja por pieza, caja, kilo u otra unidad. Esto ayudará a encontrarlo y usarlo correctamente.', 'Select the category, brand, and unit of measure. These choices affect search, reports, and how the item is received or sold.'), { optional: true }),
      step('prices', S.entityEditor, copy('5. Captura costos y precios', '5. Enter costs and prices'), copy('Registra el costo y precio de venta con la precisión indicada. Comprueba impuestos y que el margen sea el esperado antes de continuar.', 'Enter cost and sale price with the required precision. Check taxes and verify the expected margin before continuing.'), { optional: true }),
      step('status', S.entityEditor, copy('6. Revisa el estado', '6. Review status'), copy('Déjalo activo si debe aparecer en compras y punto de venta. Desactivar oculta su uso operativo, pero no elimina su historial.', 'Leave it active if it should appear in purchasing and point of sale. Deactivation hides it from operations but preserves its history.'), { optional: true }),
      step('save', S.entityEditor, copy('7. Valida y guarda', '7. Validate and save'), copy('Corrige los campos marcados y repasa SKU, código, unidad, costo y precio. Guarda una sola vez y espera la confirmación.', 'Fix highlighted fields and recheck SKU, code, unit, cost, and price. Save once and wait for confirmation.'), { optional: true }),
      step('verify', S.entityList, copy('8. Confirma el alta', '8. Confirm the result'), copy('Busca el SKU creado y verifica nombre, estado y precio. El inventario inicial se registra por el flujo autorizado, no editando el catálogo.', 'Search for the new SKU and verify its name, status, and price. Initial stock is recorded through the authorized inventory flow, not by editing the catalog.'), { optional: true }),
    ],
  },
  {
    id: 'f02-other-masters', moduleId: 'F02', version: 1, route: '/masters', estimatedMinutes: 3,
    requiredPermissions: ['catalogs.view', 'catalogs.create', 'catalogs.edit'],
    title: copy('Proveedores y catálogos', 'Suppliers and catalogs'), description: copy('Ubica categorías, marcas, unidades, almacenes y códigos alternos.'),
    steps: [
      step('header', S.pageHeader, copy('Catálogos auxiliares', 'Supporting catalogs'), copy('Estas clasificaciones se reutilizan en productos e inventario.')),
      step('cards', S.mastersCards, copy('Elige un catálogo', 'Choose a catalog'), copy('Entra a categorías, marcas, unidades, almacenes o alias. Cada opción conserva su propio listado y formulario.')),
      step('content', S.pageContent, copy('Edición controlada', 'Controlled editing'), copy('Al abrir un catálogo podrás crear o editar registros. Revisa su estado antes de usarlos en una operación.')),
    ],
  },
];
