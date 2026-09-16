---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Driver.js, Signals, RxJS, Vitest, Playwright
architecture: Sistema transversal de tutoriales modulares sobre SPA feature-first
scope: Frontend only, tutoriales F01-F09 y recorrido general, sin alterar reglas de negocio
---

# 09 - Prompt maestro para implementar tutoriales modulares con Driver.js

## Prompt listo para ejecutar

```text
Actúa como arquitecto frontend senior especializado en Angular, accesibilidad, onboarding de producto y UX para sistemas administrativos. Implementa en `distribuidora-web` un sistema completo de tutoriales guiados con Driver.js, organizado por módulos, fácil de entender, intuitivo, visualmente coherente con el sitio actual y suficientemente detallado para que una persona nueva aprenda qué hace cada pantalla sin poner en riesgo una operación real.

No entregues una demostración aislada ni un único tour lineal. Entrega una solución mantenible, tipada, probada y extensible, integrada con las rutas, permisos, traducciones, tema Material 3 y comportamiento responsive que ya existen.

## 1. Lectura obligatoria antes de modificar código

Lee completamente y respeta, en este orden:

1. `frontend_agent_prompts_mostrador_angular_responsive_material/AGENTS.md`
2. `frontend_agent_prompts_mostrador_angular_responsive_material/00_ORQUESTADOR.md`
3. `01_CONTEXTO_NEGOCIO_Y_ALCANCE.md`
4. `02_ARQUITECTURA_GLOBAL.md`
5. `03_CONVENCIONES_TRANSVERSALES.md`
6. `05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md`
7. `07_ARQUITECTURA_COMPONENTES_UX.md`
8. Los archivos `modules/F01...F09` para entender cada módulo.
9. `workflows/WF06_validacion_material_responsive.md`
10. `workflows/WF07_auditoria_composicion_ux.md`
11. La aplicación real: `package.json`, `app.routes.ts`, `app-shell.component.ts`, rutas de cada feature, traducciones, estilos globales, componentes y pruebas existentes.
12. La documentación oficial vigente de Driver.js: instalación, configuración, API, progreso y theming. No copies ejemplos antiguos ni uses una API recordada de otra versión.

Antes de implementar, inventaría las rutas y controles realmente presentes. Si una pantalla o acción descrita en este prompt aún no existe, no inventes el elemento: deja el paso preparado en el registro del módulo, desactívalo con una razón trazable o documenta el pendiente. El tour nunca debe romperse por apuntar a elementos inexistentes.

## 2. Restricciones no negociables

- Mantén Angular standalone, TypeScript strict, Signals y la arquitectura feature-first actual.
- Driver.js es una dependencia funcional de onboarding, no una segunda librería de componentes. Angular Material/CDK continúa siendo el único sistema visual de la aplicación.
- La incorporación de `driver.js` requiere un ADR breve porque es una dependencia npm nueva. Incluye necesidad, alternativas consideradas, alcance, peso/impacto, seguridad, accesibilidad, mantenimiento y estrategia de retirada.
- Instala la versión estable compatible con el proyecto mediante npm y registra el cambio en `package.json` y lockfile. No uses CDN.
- Importa `driver.js/dist/driver.css` una sola vez desde la infraestructura global de estilos.
- No hagas llamadas HTTP ni cambies contratos OpenAPI para ejecutar tutoriales.
- No alteres reglas de stock, precio, crédito, impuestos, permisos, folios, pagos o estados documentales.
- No automatices acciones destructivas o transaccionales. El tutorial explica; nunca confirma ventas, registra pagos, ajusta inventario, cancela documentos, guarda formularios ni modifica configuración por sí solo.
- No agregues tours para rutas, camiones, choferes, GPS, reparto, almacenes móviles o cualquier concepto fuera de alcance.
- No uses selectores frágiles como `nth-child`, clases visuales generadas por Material, texto visible o jerarquías profundas del DOM.
- No uses `innerHTML` con contenido dinámico ni interpolación de datos del usuario en descripciones de Driver.js. Driver.js admite HTML, pero el contenido del producto debe provenir de textos propios y confiables; prefiere texto plano y nodos seguros.
- No fuerces el tutorial en cada visita. Debe poder iniciarse, pausarse/salirse, repetirse y reiniciarse desde una zona de ayuda visible.
- No interrumpas automáticamente una venta o captura en progreso. Si existe un formulario modificado, carrito con líneas o mutación activa, solicita confirmación antes de cambiar de ruta o recomienda terminar/cancelar el recorrido.

## 3. Resultado funcional esperado

Implementa estas cuatro superficies:

1. **Acceso global de ayuda:** botón accesible `Tutoriales` o `Ayuda` en el toolbar/shell, con icono y texto/tooltip según viewport. Debe ser alcanzable por teclado y tener nombre accesible.
2. **Centro de tutoriales:** `MatDialog` en escritorio y diálogo fullscreen o `MatBottomSheet` apropiado en móvil. Lista los tutoriales agrupados por módulo, muestra descripción, duración aproximada, número de pasos, estado (`No iniciado`, `En progreso`, `Completado`, `Actualizado`) y acción `Iniciar`, `Continuar` o `Repetir`.
3. **Recorrido guiado:** overlay y popover de Driver.js con título corto, explicación concreta, progreso visible y controles en español: `Anterior`, `Siguiente`, `Finalizar` y `Cerrar`.
4. **Ayuda contextual del módulo:** una acción secundaria `Ver tutorial de este módulo` en el encabezado de cada módulo o dentro del menú de ayuda. No agregues botones duplicados en cada subcomponente.

Al abrir el centro de tutoriales solo se muestran módulos que el usuario puede visitar. Los pasos asociados a acciones sin permiso deben omitirse de forma segura, sin dejar huecos ni revelar capacidades restringidas. El backend sigue siendo la fuente de autorización.

## 4. Arquitectura requerida

Crea una infraestructura transversal pequeña y explícita, por ejemplo:

src/app/core/tutorials/
  models/
    tutorial.models.ts
  registry/
    tutorial-registry.ts
    tutorial-selectors.ts
  services/
    tutorial-orchestrator.service.ts
    tutorial-progress.service.ts
  ui/
    tutorial-launcher.component.ts
    tutorial-center.component.ts
  tours/
    shell.tour.ts
    f01-security.tour.ts
    f02-masters.tour.ts
    f03-inventory.tour.ts
    f04-purchases.tour.ts
    f05-counter-sales.tour.ts
    f06-receivables.tour.ts
    f07-audit.tour.ts
    f08-reports.tour.ts
    f09-administration.tour.ts
  testing/
    tutorial-test-ids.ts

Puedes ajustar nombres a la estructura real, pero conserva la separación entre modelos, catálogo de tours, orquestación, persistencia, UI y pruebas. `core/tutorials` no debe importar internals de las features. Si una feature aporta pasos propios, publícalos mediante un contrato tipado o provider/multi-provider sin crear ciclos.

Define contratos cerrados equivalentes a:

type TutorialModuleId =
  | 'shell'
  | 'F01'
  | 'F02'
  | 'F03'
  | 'F04'
  | 'F05'
  | 'F06'
  | 'F07'
  | 'F08'
  | 'F09';

interface TutorialDefinition {
  id: string;
  moduleId: TutorialModuleId;
  version: number;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  estimatedMinutes: number;
  route: string;
  requiredPermissions?: readonly string[];
  steps: readonly TutorialStepDefinition[];
}

interface TutorialStepDefinition {
  id: string;
  selector: TutorialSelector;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  route?: string;
  requiredPermission?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  allowInteraction?: boolean;
  optional?: boolean;
  beforeEnter?: TutorialPreparation;
}

interface TutorialProgress {
  tutorialId: string;
  version: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'dismissed';
  lastStepId?: string;
  updatedAt: string;
}

Usa tipos readonly e inmutabilidad. No uses `any`. El catálogo es declarativo: las definiciones no deben manipular directamente Router, DOM, storage o Driver.js.

## 5. Selectores estables y contrato DOM

Agrega atributos semánticos dedicados, por ejemplo `data-tour="shell-navigation"`, solo en los elementos relevantes. Centraliza sus nombres como constantes tipadas. Los atributos de tutorial no deben afectar layout, pruebas funcionales ni estilos.

Reglas:

- Un selector describe intención de producto: `pos-product-search`, no estructura: `.content > div:nth-child(2)`.
- Cada selector es único dentro de la ruta activa.
- No apuntes a internals de `mat-form-field`, `mat-table`, `mat-dialog` o componentes MDC.
- Cuando el objetivo está oculto en móvil, prepara primero la interfaz: abre el sidenav, expansión, tab, drawer o panel correspondiente y espera a que el elemento exista.
- Espera navegación y renderizado de manera acotada, usando `NavigationEnd`, estabilidad de Angular y/o `MutationObserver` con timeout. No uses `setTimeout` arbitrarios como sincronización principal.
- Si un objetivo opcional no aparece por permiso, viewport, estado o datos, omite el paso y continúa.
- Si falta un objetivo obligatorio, detén el tour con un mensaje recuperable y registra telemetría técnica sin datos sensibles; nunca dejes un overlay bloqueando la página.

Lista base de selectores a adaptar a la UI real:

- Shell: `help-launcher`, `shell-navigation`, `shell-language`, `shell-user`, `shell-logout`, `page-content`.
- Dashboard: `dashboard-summary`, `dashboard-kpis`, `dashboard-quick-actions`.
- F01: `security-task-nav`, `users-list`, `roles-list`, `permissions-matrix`, `security-primary-action`.
- F02: `customers-search`, `customers-list`, `customer-primary-action`, `suppliers-search`, `products-search`, `products-list`, `product-primary-action`, `masters-cards`.
- F03: `inventory-task-nav`, `inventory-filters`, `inventory-balances`, `inventory-kardex`, `inventory-low-stock`, `inventory-adjustment-action`.
- F04: `purchases-task-nav`, `purchase-filters`, `purchase-list`, `purchase-editor`, `purchase-lines`, `purchase-status`, `goods-receipt-action`.
- F05: `pos-customer`, `pos-product-search`, `pos-product-results`, `pos-cart`, `pos-line-actions`, `pos-totals`, `pos-payment-method`, `pos-cash-tendered`, `pos-change`, `pos-charge-action`, `pos-sale-result`.
- F06: `receivables-task-nav`, `receivables-filters`, `receivables-list`, `customer-statement`, `payment-action`, `payment-application`, `payment-result`.
- F07: `audit-task-nav`, `audit-filters`, `audit-list`, `audit-detail`, `before-after`, `error-log`, `cancellation-reasons`.
- F08: `reports-task-nav`, `report-filters`, `report-kpis`, `report-chart`, `report-accessible-table`, `report-empty-state`.
- F09: `administration-task-nav`, `settings-list`, `folio-sequences`, `payment-methods`, `payment-terminals`, `policies`, `trace-search`.

No agregues todos estos atributos a ciegas. Verifica primero que la superficie exista y colócalos en el componente dueño.

## 6. Orquestación de Driver.js

Encapsula por completo Driver.js en `TutorialOrchestratorService`; ningún componente de negocio debe importar `driver` directamente.

La instancia debe configurarse, como mínimo, con:

- `showProgress: true`.
- `progressText: 'Paso {{current}} de {{total}}'`, usando traducciones si la aplicación soporta español e inglés.
- textos localizados para siguiente, anterior y finalizar.
- navegación por teclado habilitada.
- clase global `distribuidora-tour` mediante `popoverClass`.
- padding, radio y offset acordes a los tokens actuales.
- interacción deshabilitada por defecto sobre el elemento activo; habilitarla solo en pasos pedagógicos explícitamente seguros.
- comportamiento de click en overlay que no provoque cierres accidentales; ofrece una salida clara y accesible.
- hooks para guardar el último paso, marcar finalización, limpiar recursos y restaurar foco.

No reemplaces `onNextClick`, `onPrevClick`, `onCloseClick` u `onDoneClick` sin implementar explícitamente `moveNext()`, `movePrevious()` o `destroy()` según exige la API vigente de Driver.js. Al finalizar o cerrar, destruye siempre la instancia y elimina observers/subscriptions.

Cuando un tour cruza rutas:

1. Comprueba si hay trabajo no guardado o una operación en curso.
2. Navega con Angular Router a la ruta declarada.
3. Espera `NavigationEnd` y la disponibilidad del objetivo.
4. Prepara el estado visual necesario sin ejecutar acciones de negocio.
5. Continúa en el paso correspondiente.

Solo puede existir una instancia activa. Iniciar otro tutorial debe cerrar limpiamente el anterior. Al hacer logout, expirar sesión, destruir el shell o navegar a `/login`, destruye el tour activo.

## 7. Persistencia y reanudación

Guarda únicamente progreso no sensible. No almacenes DTOs, nombres, correos, permisos completos, tokens, datos de ventas ni contenido de formularios.

- Usa una clave versionada, por ejemplo `distribuidora:tutorial-progress:v1`.
- La persistencia puede ser local al navegador; si existe una clave estable y no sensible aprobada para separar cuentas, úsala sin exponer PII. Si no existe, documenta que el progreso es por navegador.
- Valida y sanea el JSON leído; ante corrupción, descártalo sin romper la aplicación.
- Si `TutorialDefinition.version` aumenta, muestra el módulo como `Actualizado` y permite recorrerlo nuevamente.
- Guarda `in-progress` y `lastStepId` al cambiar de paso.
- Marca `completed` solo al pulsar `Finalizar` en el último paso.
- Distingue cerrar/omitir de completar.
- Incluye `Reiniciar progreso` por tutorial y `Reiniciar todos`, con confirmación proporcional.

No sincronices progreso con backend mientras no exista un contrato OpenAPI. No inventes endpoints.

## 8. Diseño visual “cool” y coherente con el sitio

El tour debe sentirse parte de Distribuidora: claro, sobrio, moderno y operativo, no como un widget externo.

- Usa los tokens existentes: `--app-surface`, `--app-text`, `--app-text-muted`, `--app-primary`, `--app-primary-strong`, `--app-border`, radios, sombras y espacios.
- Aplica estilos globales exclusivamente bajo `.driver-popover.distribuidora-tour` y clases oficiales de Driver.js. No afectes popovers ajenos.
- Popover con superficie limpia, borde discreto, radio del sistema, sombra contenida y ancho fluido: aproximadamente `min(22rem, calc(100vw - 2rem))`.
- Título con jerarquía clara; descripción con frases cortas y una idea por párrafo.
- Progreso visible pero secundario.
- Botón siguiente/terminar como acción primaria; anterior como secundaria; cerrar claramente accesible.
- Touch targets cercanos a 48 x 48 px cuando el espacio lo permita.
- Overlay con contraste suficiente sin ocultar por completo el contexto.
- No uses gradientes decorativos, brillos, animaciones largas ni colores hardcodeados por módulo.
- Respeta `prefers-reduced-motion` y no fuerces transiciones cuando esté activo.
- Asegura `z-index` correcto frente a toolbar, sidenav, dialogs, bottom sheets y autocompletes sin crear valores arbitrarios dispersos.
- En 320 px, el popover no debe salir del viewport, tapar permanentemente la acción de cerrar ni provocar overflow horizontal.
- Al 200% de zoom todos los controles deben seguir disponibles.

Aunque los botones del popover son DOM de Driver.js y no componentes Angular Material, dales apariencia consistente con los tokens Material del producto. No intentes montar componentes Angular dentro del popover salvo que exista una justificación y pruebas claras.

## 9. Microcopy y reglas pedagógicas

Cada paso debe responder, en lenguaje operativo, a estas preguntas:

1. ¿Qué estoy viendo?
2. ¿Para qué sirve?
3. ¿Qué debo hacer aquí?
4. ¿Qué precaución importa?

Reglas de escritura:

- Títulos de 2 a 6 palabras.
- Descripciones preferentemente de 1 a 3 frases cortas.
- Usa verbos concretos: `Busca`, `Selecciona`, `Revisa`, `Confirma`.
- Evita términos como endpoint, DTO, adapter, request, signal, store o correlation ID, salvo en una vista técnica autorizada. Para usuarios usa `referencia de soporte` cuando corresponda.
- No prometas éxito antes de la respuesta del backend.
- Explica que estados y totales confirmados provienen del sistema.
- En acciones críticas, indica que el tutorial no ejecutará la acción.
- Localiza todo texto visible en el catálogo i18n actual para español e inglés; no dejes literales dispersos en los archivos de tours.

## 10. Catálogo obligatorio de tutoriales

Divide recorridos largos en tutoriales pequeños de 5 a 10 pasos. Ningún tour debería exceder 12 pasos sin una justificación de UX. El centro de tutoriales los agrupa por módulo.

### Recorrido general - Conoce el sistema

Objetivo: enseñar navegación y ayuda sin entrar en operaciones.

Pasos mínimos:

1. Bienvenida y propósito del sistema.
2. Menú de navegación y sus grupos Operación, Catálogos y Control.
3. Inicio/dashboard y lectura del resumen.
4. Área principal de contenido.
5. Selector de idioma.
6. Identidad/sesión del usuario.
7. Centro de tutoriales y cómo repetir un recorrido.
8. Cierre de sesión.

En móvil, abre el sidenav antes de explicarlo y ciérralo antes de señalar contenido. No cambies de ruta si hay captura en progreso.

### F01 - Usuarios, roles y permisos

Tutorial A, `Administrar usuarios`:

1. Navegación del módulo de seguridad.
2. Listado y búsqueda de usuarios.
3. Lectura de estado del usuario.
4. Acción para crear usuario, sin enviarla.
5. Edición y activación/desactivación según UI real.
6. Asignación de roles.
7. Mensajes de validación y permisos.

Tutorial B, `Roles y permisos`:

1. Listado de roles.
2. Creación de rol.
3. Matriz/catálogo de permisos.
4. Búsqueda y agrupación de permisos.
5. Guardado y advertencia de autorización del backend.

Omitir el módulo completo para usuarios sin permiso de acceso. No revelar nombres de permisos que la UI no exponga.

### F02 - Clientes, proveedores, productos y catálogos

Tutorial A, `Gestionar clientes`:

1. Búsqueda y filtros.
2. Listado responsive y estado.
3. Crear cliente.
4. Datos fiscales/contacto según formulario real.
5. Límite/estado de crédito como dato autoritativo.
6. Guardar, cancelar y errores de validación.

Tutorial B, `Gestionar productos`:

1. Buscar por SKU, código o nombre.
2. Filtros y paginación.
3. Estado y datos principales.
4. Crear/editar producto.
5. Categoría, marca y unidad.
6. Alias o códigos alternos.
7. Errores de duplicidad y activación/desactivación.

Tutorial C, `Proveedores y otros catálogos`:

1. Proveedores.
2. Categorías.
3. Marcas.
4. Unidades.
5. Almacenes centrales/mostrador según alcance real.
6. Alias de producto.
7. Diferencia entre editar y desactivar.

No combines todos los catálogos en un tour interminable. Si una superficie no existe, divídela o márcala pendiente.

### F03 - Inventario

Tutorial A, `Consultar inventario`:

1. Navegación de tareas del módulo.
2. Filtros por producto y almacén.
3. Existencia disponible, reservada y total solo si la API/UI las muestra.
4. Listado responsive.
5. Stock bajo.
6. Actualizar consulta/estado vacío/error.

Tutorial B, `Revisar kardex y ajustes`:

1. Filtros de kardex y rango de fechas.
2. Tipo, fecha, referencia y usuario del movimiento.
3. Detalle del movimiento.
4. Inicio de ajuste con permiso.
5. Motivo y cantidades.
6. Resumen previo.
7. Confirmación/cancelación explicada, sin ejecutarla.
8. Conflicto y recarga de saldo real.

### F04 - Compras y recepciones

Tutorial A, `Crear una compra`:

1. Filtros y listado.
2. Estado Borrador/Confirmado/Cancelado.
3. Nueva compra.
4. Selección de proveedor.
5. Agregar productos y cantidades.
6. Costos/totales informativos según UI.
7. Guardar borrador.
8. Confirmar compra sin confundirla con entrada de inventario.

Tutorial B, `Recibir mercancía`:

1. Abrir compra o recepción.
2. Elegir almacén destino.
3. Capturar cantidades recibidas.
4. Diferencias entre pedido y recibido.
5. Recepción parcial/completa según UI real.
6. Resumen antes del cierre.
7. Cierre y actualización de inventario por backend, sin ejecutarlo.

### F05 - Punto de venta

Este módulo es prioritario y debe dividirse para que el cajero aprenda sin fatiga.

Tutorial A, `Preparar una venta`:

1. Contexto de la venta y estado del borrador.
2. Selección de cliente.
3. Buscador por SKU, código de barras o nombre.
4. Resultados y disponibilidad.
5. Agregar producto de forma demostrativa solo si existe un modo seguro; de lo contrario, explicar sin interactuar.
6. Carrito y líneas.
7. Cambiar cantidad/quitar línea, sin alterar una venta real durante el tour.
8. Totales preliminares frente a totales confirmados por backend.
9. Atajos de teclado reales disponibles.

Tutorial B, `Cobrar una venta`:

1. Acción Cobrar siempre visible.
2. Método de pago.
3. Pago de contado, crédito o mixto solo si la UI/contrato lo permite.
4. Importe pendiente.
5. Campo Efectivo recibido.
6. Cambio a devolver y validación de efectivo insuficiente.
7. Terminal de tarjeta cuando aplique.
8. Resumen de confirmación.
9. Prevención de doble cobro.
10. Explicación clara de que el tutorial no confirmará ni enviará pagos.

Tutorial C, `Después de vender`:

1. Resultado confirmado.
2. Folio y estado real.
3. Resumen/comprobante.
4. Impresión.
5. Historial de ventas.
6. Detalle de venta.
7. Cancelación con motivo y permiso, sin ejecutarla.
8. Facturación electrónica/receptor fiscal solo si está visible y autorizada.

Nunca inicies automáticamente un tutorial del POS cuando exista un carrito con líneas, un pago abierto o una mutación en curso. Los atajos del tour no deben interceptar F2/F4/F8/F9 usados por el POS.

### F06 - Cobranza

Tutorial A, `Consultar cartera`:

1. Filtros por cliente, vencimiento y estado.
2. Listado de cuentas.
3. Estados vigente, vencido y pagado.
4. Saldo y documento origen.
5. Estado de cuenta del cliente.
6. Estrategia responsive del listado.

Tutorial B, `Registrar y aplicar un pago`:

1. Acción de pago según permiso.
2. Datos del pago.
3. Selección de cuentas.
4. Distribución/aplicación disponible.
5. Saldo antes y después.
6. Confirmación y protección contra doble envío.
7. Resultado/comprobante.
8. Manejo de conflicto, sin enviar una operación real.

### F07 - Auditoría y soporte

Tutorial A, `Consultar auditoría`:

1. Filtros por usuario, entidad, acción y fecha.
2. Lista de eventos auditables.
3. Actor, fecha, acción y motivo.
4. Detalle humano de antes/después.
5. Panel técnico opcional.
6. Deep links e historial de entidad.

Tutorial B, `Errores y cancelaciones`:

1. Bandeja de errores operativos.
2. Estado y referencia de soporte.
3. Detalle y recuperación.
4. Catálogo de motivos de cancelación.
5. Consecuencias de cancelar.
6. Confirmación explícita, sin ejecutar cancelaciones.

### F08 - Dashboard y reportes

Tutorial A, `Entender el dashboard`:

1. Fecha de actualización.
2. Indicadores principales.
3. Acciones rápidas.
4. Diferencia entre cero datos, carga y error.
5. Navegación hacia el detalle.

Tutorial B, `Consultar reportes`:

1. Selección del reporte.
2. Filtros y rango de fechas.
3. Aplicar/limpiar filtros.
4. KPI o resumen.
5. Gráfica.
6. Tabla/resumen accesible equivalente.
7. Lectura responsive.
8. Explicar que las métricas provienen del backend y que no existe exportación si el API no la ofrece.

### F09 - Administración

Divide por responsabilidades:

Tutorial A, `Configuración y folios`:

1. Navegación administrativa.
2. Configuraciones disponibles desde backend.
3. Edición de una clave permitida.
4. Secuencias/folios.
5. Confirmación de cambios críticos.
6. Conflicto de concurrencia.

Tutorial B, `Métodos y terminales de pago`:

1. Métodos de pago.
2. Lista de terminales.
3. Alta/edición.
4. Terminal predeterminada.
5. Activar/desactivar.
6. Conflicto por cobro activo.

Tutorial C, `Políticas y trazabilidad`:

1. Política de crédito.
2. Política de inventario.
3. Búsqueda de traza.
4. Traza por operación, referencia, folio o evento según UI.
5. Línea de tiempo/detalle.
6. Precaución con cambios administrativos.

## 11. Accesibilidad

Verifica y corrige, dentro del alcance del tutorial:

- El launcher y centro de tutoriales funcionan solo con teclado.
- El foco inicial del popover es predecible y visible.
- `Tab` no deja controles inaccesibles; `Esc` tiene comportamiento documentado y no entra en conflicto con overlays de negocio.
- Al cerrar/finalizar, el foco vuelve al botón que inició el tutorial o a un destino lógico existente.
- Los botones tienen nombres accesibles en el idioma activo.
- La información no depende solo de color o posición.
- El contraste cumple WCAG AA.
- Lectores de pantalla reciben título, descripción y progreso de forma comprensible según las capacidades reales de Driver.js. Si detectas una limitación de la biblioteca, documéntala y agrega una alternativa accesible desde el centro de tutoriales, como una lista textual completa de pasos.
- Con `prefers-reduced-motion`, reduce o elimina animación.
- No seques el foco detrás de un `MatDialog`, `MatBottomSheet` o autocomplete abierto. El orquestador debe preparar/cerrar overlays antes de avanzar cuando sea seguro.

## 12. Responsive

Prueba como mínimo:

- 320 x 568
- 390 x 844
- 768 x 1024
- 1024 x 768
- 1366 x 768
- 1920 x 1080
- zoom de navegador al 200%

En móvil:

- El centro de tutoriales ocupa el espacio necesario sin salirse del viewport.
- El popover usa ancho fluido y botones que ajustan o apilan sin cortes.
- El tour puede abrir/cerrar el sidenav antes de resaltar enlaces.
- No queda oculto detrás del teclado virtual.
- No causa overflow horizontal del body.
- No tapa permanentemente el elemento explicado; usa colocación automática/alternativa cuando no haya espacio.

## 13. Pruebas obligatorias

### Unitarias con Vitest

- Registro devuelve tours ordenados por módulo.
- Filtrado por permisos elimina tours/pasos no autorizados.
- Conversión de `TutorialStepDefinition` a `DriveStep` conserva textos, selector y colocación.
- Persistencia guarda, recupera, valida y migra progreso versionado.
- JSON corrupto no rompe la aplicación.
- Nueva versión de tour se marca como actualizada.
- Completar, cerrar y reiniciar producen estados diferentes.
- Un objetivo opcional ausente se omite.
- Un objetivo obligatorio ausente genera salida recuperable y destruye el overlay.
- La instancia activa se destruye en logout y al iniciar otro tour.

### Pruebas de componentes

- Launcher tiene nombre accesible y abre el centro.
- Centro agrupa F01-F09, muestra progreso y emite iniciar/continuar/repetir.
- Solo aparecen módulos permitidos.
- Textos cambian con el idioma.
- Estados vacío, sin permisos y error de storage son utilizables.

Usa Angular Material Harnesses para dialog/buttons cuando aporten estabilidad. No pruebes internals de Material ni de Driver.js.

### E2E con Playwright

- Abrir tutorial general, avanzar, retroceder y finalizar.
- Cerrar a la mitad, recargar y continuar desde el último paso.
- Repetir un tutorial completado.
- Usuario limitado no ve tutoriales ni pasos restringidos.
- Tour móvil abre el sidenav y encuentra su objetivo.
- Cambio de ruta espera render sin timeouts frágiles.
- No existe overflow global durante el tour.
- Foco se restaura al cerrar.
- `Escape` y navegación de teclado funcionan sin activar atajos peligrosos del POS.
- Tutorial POS no confirma venta ni registra pago; intercepta/red de prueba debe demostrar cero mutaciones causadas por el tour.
- Si falta un selector opcional, el recorrido continúa; si falta uno obligatorio, muestra recuperación y elimina overlay.
- Capturas visuales estables del popover en móvil, tableta y escritorio.

Usa identificadores de tutorial estables en tests. No bases las pruebas en textos traducidos cuando exista un selector semántico.

## 14. Telemetría segura y errores

Si ya existe infraestructura de telemetría, registra únicamente eventos técnicos sin PII:

- `tutorial_opened`
- `tutorial_started`
- `tutorial_step_viewed`
- `tutorial_completed`
- `tutorial_dismissed`
- `tutorial_target_missing`

Incluye `tutorialId`, `version`, `stepId` y módulo; no captures contenido de inputs, nombres, folios, productos, clientes ni datos financieros. Si no existe infraestructura, define una interfaz no-op; no agregues un proveedor externo.

Los fallos del tutorial nunca deben bloquear una tarea de negocio. Ante error: destruye overlay, restaura foco, muestra mensaje seguro y deja la aplicación operable.

## 15. Orden de implementación

Entrega slices pequeños y verificables:

1. ADR y dependencia.
2. Contratos, registro, selectores y adapter Driver.js.
3. Persistencia versionada y filtrado por permisos.
4. Launcher y centro de tutoriales.
5. Tema global responsive/accesible.
6. Recorrido general.
7. Tours F01-F04.
8. Tours F05-F09.
9. i18n español/inglés.
10. Unit/component tests.
11. E2E y validación visual/responsive.
12. Documentación de mantenimiento: cómo agregar, versionar o retirar un tour.

No declares terminada una fase con selectores rotos, textos provisionales o pruebas omitidas.

## 16. Definition of Done

La implementación se acepta únicamente cuando:

[ ] Driver.js está instalado por npm, encapsulado y documentado con ADR.
[ ] Existe un centro de tutoriales accesible desde el shell.
[ ] Los recorridos están agrupados por Shell y F01-F09.
[ ] Los recorridos largos están divididos en tareas comprensibles.
[ ] Los textos son claros, localizados y no contienen jerga técnica innecesaria.
[ ] Los selectores `data-tour` son semánticos, tipados y estables.
[ ] Los pasos respetan rutas, permisos, estado y viewport.
[ ] Un elemento ausente no deja la app bloqueada.
[ ] Ningún tour ejecuta mutaciones de negocio.
[ ] Progreso, continuación, repetición y reinicio funcionan.
[ ] Cerrar no equivale a completar.
[ ] El tema usa tokens existentes y se ve integrado con Material 3.
[ ] Funciona desde 320 px hasta escritorio amplio y a zoom 200%.
[ ] Teclado, foco, contraste y reduced motion fueron validados.
[ ] Logout/login y destrucción de componentes limpian la instancia activa.
[ ] Tests unitarios, de componentes y E2E críticos pasan.
[ ] `npm run lint`, `npm test`, `npm run build` y `npm run e2e` pasan.
[ ] Se ejecutaron WF06 y WF07 con evidencia.
[ ] Existe documentación corta para que otro desarrollador agregue un tutorial sin copiar lógica.

## 17. Entrega del agente

Entrega el resultado con este formato:

### Resumen
Qué sistema de tutoriales quedó disponible y qué módulos cubre.

### Arquitectura
Registro, orquestador, permisos, persistencia y ciclo de vida.

### Tutoriales implementados
Tabla con ID, módulo, ruta, número de pasos, permisos, versión y estado.

### Archivos creados/modificados
Agrupados por core, shared, features, estilos, i18n, ADR y pruebas.

### UX y accesibilidad
Comportamiento de teclado, foco, salida, reanudación y alternativa textual.

### Material, estilo y responsive
Tokens usados, estrategia del popover y viewports probados.

### Seguridad y permisos
Cómo se evita revelar acciones o ejecutar mutaciones.

### Pruebas y evidencia
Resultados de unit, component, E2E, lint y build.

### Riesgos o pendientes
Pantallas aún inexistentes, limitaciones reales de Driver.js o decisiones humanas necesarias.

No respondas solo con recomendaciones: implementa el código, las pruebas, el ADR y la documentación, y presenta evidencia verificable de que los tutoriales funcionan.
```

## Referencias oficiales para el agente

- Instalación: https://driverjs.com/docs/installation
- Uso básico: https://driverjs.com/docs/basic-usage
- Configuración y hooks: https://driverjs.com/docs/configuration
- API: https://driverjs.com/docs/api
- Progreso: https://driverjs.com/docs/tour-progress
- Personalización visual: https://driverjs.com/docs/theming

