# Propuesta: búsqueda y selección de productos en Punto de Venta

Estado: propuesta UX/UI y especificación de implementación; no modifica la aplicación. Alcance: reemplazar el contenido de «Agregar productos», conservando cliente, almacén, carrito, totales y cobro. Basada en los dos orquestadores, el requerimiento adjunto y el código actual. No se recibió una imagen accesible de la pantalla; la referencia es su plantilla Angular.

## 1. Decisión UX/UI

El buscador será la entrada principal y la lista compacta será la vista predeterminada. La cuadrícula queda como alternativa explícita para operación táctil; cambiar de vista conserva consulta, filtros y selección. Evitar cambiar automáticamente de lista a cuadrícula mientras el cajero trabaja.

La meta de 1–3 segundos es un objetivo que debe medirse con cajeros y un catálogo representativo, no una garantía basada únicamente en el diseño.

## 2. Distribución visual

```text
Agregar productos
Busca por nombre, SKU o código de barras

┌────────────────────────────────────────────────────────────────────┐
│ Buscar producto…                                      [×]     F2  │
└────────────────────────────────────────────────────────────────────┘
[Todos] [★ Favoritos] [Más vendidos] [Recientes]
[Abarrotes] [Bebidas] [Botanas] [Más categorías ▾]       [Filtros (2)]

[Bebidas ×] [Con existencia ×]                      Limpiar filtros

Resultados para «coca»                    18 resultados  [Lista ▾]
──────────────────────────────────────────────────────────────────────
▣ Coca-Cola 600 ml          COC-600     24 disp.   $18.00      [+]
▣ Coca-Cola 1.75 L          COC-1750     8 disp.    $36.00      [+]
▣ Coca-Cola Zero 600 ml     COZ-600     17 disp.   $18.00      [+]
▣ Coca-Cola 3 L             COC-3000    ⚠ Bajo: 4  $48.00      [+]
──────────────────────────────────────────────────────────────────────
Mostrando 1–18 de 18                               [Anterior][Siguiente]
↑ ↓ Seleccionar · Enter Agregar
```

Los productos y cifras anteriores son ilustrativos. El conteo real procede del servidor y cambia con la búsqueda y los filtros. Mientras una consulta esté pendiente, no asociar el total anterior al texto nuevo.

El encabezado y el campo permanecen visibles durante el desplazamiento del selector. Usar una única región de desplazamiento claramente identificable; no introducir varios scrolls pequeños anidados. Respetar la altura de la barra de la aplicación y del teclado virtual.

Jerarquía: buscador; nombre/presentación; precio y acción; existencia; SKU. Imagen opcional de 28–32 px o icono neutro, nunca una fotografía grande. Precios alineados a la derecha. Nombres similares deben conservar el volumen, sabor o presentación visible; permitir dos líneas antes de truncar.

Fondo claro, azul primario y bordes suaves mediante tokens existentes de Material. La fila activa usa foco visible y fondo sutil. Inventario bajo se expresa con icono y texto, además de color. El botón tiene nombre accesible, por ejemplo «Agregar una unidad de Coca-Cola 600 ml».

## 3. Categorías, sugerencias y filtros

Separar conceptualmente la colección seleccionada —Todos, Favoritos, Más vendidos, Recientes— de la categoría. Así se puede consultar «Favoritos de Bebidas» sin que una selección borre la otra. La consulta se combina con ambos filtros; «Todos» restablece la colección, mientras «Limpiar filtros» elimina todas las restricciones y conserva el texto.

Mostrar pocas categorías frecuentes y «Más categorías». Este control abre un selector con búsqueda remota paginada y, cuando el catálogo las tenga, subcategorías. En touch, la fila de categorías puede desplazarse horizontalmente dentro del componente. No descargar ni dibujar cientos de categorías.

Al enfocar el buscador, presentar hasta ocho sugerencias agrupadas: productos, categorías/marcas y consultas recientes. Las categorías y marcas aplican filtros; un producto agrega una unidad; una consulta reciente repite la búsqueda. No insertar botones interactivos dentro de una opción del autocomplete: las acciones + pertenecen al listado principal.

Al escribir, priorizar sugerencias relacionadas. No llenar el desplegable con productos frecuentes sin relación con la consulta. La lista principal y las sugerencias comparten consulta y versión de resultados para evitar discrepancias. Resaltar coincidencias mediante segmentos de texto seguros, sin insertar HTML recibido del servidor. Una coincidencia aproximada puede indicar «Similar a…» sin inventar letras coincidentes.

Filtros: categoría, marca, precio mínimo/máximo, con existencia, inventario bajo y favoritos. Validar rango mínimo ≤ máximo. Desktop usa panel compacto anclado; tablet/móvil, bottom sheet Material. Los cambios del formulario se aplican juntos con «Aplicar»; las categorías rápidas y chips removibles sí actualizan de inmediato. Mostrar conteo de filtros activos.

## 4. Estados e interacciones

| Estado | Comportamiento |
|---|---|
| Inicio sin texto | Mostrar Más vendidos si existe información real. Si no, Recientes o una primera página identificada como Productos. Nunca etiquetar el orden alfabético como ventas frecuentes. |
| Escribiendo | Debounce inicial de 200 ms para texto. Cancelar inmediatamente la consulta anterior al cambiar texto/filtros y descartar respuestas antiguas. |
| Carga inicial | Skeleton de pocas filas; buscador y carrito operables. |
| Actualizando | Indicador local. No permitir Enter sobre una selección que pertenece a la consulta anterior. |
| Resultados | Lista compacta con conteo, selección estable por ID y páginas de 30 productos. |
| Agregado | Sumar una unidad al borrador, breve confirmación en la fila y anuncio accesible «Agregado…». Conservar consulta y posición. |
| Ya en carrito | Mostrar «3 en venta» junto a +; edición − / cantidad / + opcional y con espacio reservado para evitar saltos. Restar hasta cero quita la partida según el flujo vigente. |
| Sin existencia | Conservar producto visible, indicar motivo y deshabilitar agregar conforme a la política de stock del backend. |
| Stock desconocido | Indicar «Consultando existencia» o «No disponible», nunca tratarlo como cero. |
| Sin coincidencias | «No encontramos resultados para …», limpiar filtros, cambiar categoría y sugerencia real de búsqueda similar si existe. |
| Error | Mensaje local con Reintentar. Conservar consulta y carrito; no mostrar el error como ausencia de productos. |
| Sin conexión | Informar que no se puede verificar stock/precio; no afirmar que los datos en caché están actualizados. |

La existencia corresponde al almacén elegido. Diferenciar stock disponible informado por API de cantidad ya colocada en el borrador para no descontarla dos veces. Al cambiar de almacén, invalidar resultados/caché dependientes y reconciliar el carrito mediante el comportamiento vigente.

Agregar al borrador no equivale a confirmar una venta ni a reservar existencias. La confirmación conserva validaciones, transacción y autoridad del backend sobre dinero e inventario.

## 5. Teclado y lector

| Entrada | Acción |
|---|---|
| F2 | Enfocar y seleccionar el contenido del buscador. No actuar sobre diálogos de cobro abiertos. |
| ↓ / ↑ en búsqueda | Recorrer sugerencias si están abiertas; en caso contrario, recorrer resultados vigentes. Mantener una única selección activa. |
| Enter | Seleccionar la sugerencia activa o agregar el producto activo. Un solo controlador resuelve la acción y evita doble agregado por propagación. |
| Esc | Primero cierra el desplegable; si ya está cerrado, limpia la consulta. No vacía carrito ni elimina filtros silenciosamente. |
| + / − | Cambiar cantidad únicamente cuando el foco esté en el resultado/control de cantidad; dentro de campos de texto se escriben normalmente. |
| Tab | Navegación nativa por filtros, controles y acciones. |

Después de agregar con teclado o +, el foco vuelve al buscador y selecciona su texto sin borrarlo. Así Enter puede repetir el agregado y escribir un carácter inicia una consulta nueva. Si se editan cantidades de forma repetida, conservar el foco en ese control hasta terminar. En tablet, restaurar foco sin forzar innecesariamente la apertura del teclado virtual.

Para lector tipo teclado, configurar terminador Enter. Acumular el código en una entrada delimitada y resolver coincidencia exacta al recibir el terminador, sin esperar el debounce de texto. Código escrito manualmente + Enter usa la misma resolución exacta. No agregar automáticamente al detectar un prefijo numérico mientras todavía se escribe.

Cada lectura completa produce una intención de agregar. Dos lecturas voluntarias del mismo código agregan dos unidades; no suprimirlas por igualdad de texto. Evitar que el mismo Enter llegue además al manejador de selección o al formulario. Encadenar lecturas pendientes conservando orden e identidad; no cancelar escaneos válidos porque comience otro.

Si el código tiene una coincidencia activa y vendible, agregar una unidad. Si hay ambigüedad, código desconocido o stock insuficiente, mostrar el resultado y solicitar selección/corrección; nunca elegir por aproximación en el flujo de escaneo. No capturar teclas globalmente en cliente, pagos, notas ni diálogos. Mantener las últimas búsquedas de texto separadas del buffer del lector.

## 6. Escalabilidad y búsqueda del servidor

Diagnóstico confirmado: `counter-sales-api.adapter.ts` carga `/api/v1/products?Page=1&PageSize=100`; `counter-sales.store.ts` filtra localmente nombre/SKU/barcode y limita a 12 productos iniciales o 24 coincidencias. Por ello un producto fuera de esos primeros 100 no se puede encontrar en este selector, aunque exista en el catálogo.

La API documentada de productos acepta Search, Page y PageSize. No documenta los filtros, ranking ni sugerencias requeridos. ProductResponse tampoco reúne stock por almacén, etiquetas de marca/categoría, favoritos o frecuencia de venta. Estas son brechas del contrato revisado; no se presupone que existan endpoints adicionales.

Proponer un caso de uso de búsqueda POS, con contrato por definir y registrar en OpenAPI y matriz de integración antes de consumirlo:

- Entrada: consulta, almacén, colección, categoría/marca, rango de precio, disponibilidad, página/tamaño y contexto autorizado de precios.
- Salida: identificador, nombre, SKU, código, presentación cuando exista, precio autorizado, existencia, umbral/estado de stock bajo, etiquetas de categoría/marca, favorito y metadatos de paginación.
- Resolución exacta de código inequívoca y separable de búsqueda aproximada.
- Sugerencias tipadas y correcciones opcionales; sin texto ficticio cuando el servidor no tenga una alternativa válida.
- Favoritos con alcance explícito por usuario y negocio. Más vendidos según ventas confirmadas netas de cancelaciones en una ventana inicial propuesta de 30 días. Recientes son productos agregados en esta sesión; búsquedas recientes son consultas confirmadas, no cada pulsación.

Orden propuesto entre candidatos relacionados: código exacto, SKU exacto, nombre exacto, frecuencia de venta, prefijo, coincidencia parcial y aproximación. Aplicar coincidencia de múltiples términos para «coca 600». No dejar que popularidad introduzca productos ajenos a la consulta. Desempatar de forma estable por nombre e ID; congelar criterio de ranking durante la navegación paginada para reducir saltos.

Inicialmente usar páginas de 30 con Anterior/Siguiente, reiniciando página ante cambios de consulta o filtros. No es necesario virtualizar 30 filas. Si después se adopta scroll continuo, incorporar una ventana limitada de páginas y CDK virtual scroll, verificando accesibilidad y alturas; la virtualización no sustituye la paginación remota.

Caché acotada sugerida: 20 consultas, TTL inicial de 30 segundos, con clave por usuario/negocio, almacén, contexto de precio, consulta, filtros y página. Invalidar ante cambio de contexto y eventos relevantes de stock/precio; los importes y existencias deben revalidarse en el flujo de venta. Búsquedas recientes limitadas a diez por sesión y borradas al cerrar sesión.

PostgreSQL: revisar índices existentes antes de agregar migraciones. Evaluar B-tree para SKU/código exactos y claves de almacén/producto; evaluar `pg_trgm` con GIN o GiST para texto parcial/aproximado. Usar una proyección normalizada de nombre, aliases, marca y categoría con mantenimiento definido. No confiar en trigramas como solución universal para términos muy cortos como «arz»: probar aliases y ranking con datos reales. PostgreSQL documenta tanto similitud como índices especializados: [pg_trgm](https://www.postgresql.org/docs/17/pgtrgm.html).

Medir planes y latencia con catálogo de 50.000 productos, consultas cortas, errores tipográficos y concurrencia representativa. Proponer como presupuesto inicial p95 de resultados visibles ≤500 ms después de la última tecla y código resuelto/agregado ≤500 ms en la red de tienda; validarlos antes de prometerlos. Medir también tiempo humano para encontrar y agregar, tasa de selección equivocada y correcciones de cantidad.

## 7. Desktop, tablet y móvil

| Superficie | Adaptación del selector |
|---|---|
| Desktop | Lista por defecto; filas de aproximadamente 56–64 px, SKU en columna secundaria y precio/+ alineados. Carrito y cobro conservan ubicación existente. |
| Tablet horizontal | Filas de aproximadamente 64–72 px y objetivos táctiles de al menos 48 × 48 px; categorías desplazables y filtros en panel adaptable. |
| Tablet vertical | Nombre y presentación en dos líneas, SKU debajo; precio, existencia y + visibles. Cuadrícula opcional de dos columnas cuando quepa. |
| Móvil desde 320 px | Una columna; precio y agregar junto al bloque de nombre, existencia/SKU debajo. Sin overflow horizontal global. Filtros en bottom sheet. |

Los valores son objetivos de diseño para expresar mediante tokens existentes. Adaptar según ancho real del selector, no solo ancho de ventana. No ocultar presentación ni precio para hacer caber columnas. Comprobar 200% de zoom y textos largos. Evitar un alto fijo que deje fuera el buscador cuando aparece el teclado virtual.

## 8. Componentes e implementación por slices

| Pieza | Responsabilidad |
|---|---|
| ProductPickerComponent | Componer buscador, colecciones, filtros y resultados dentro de la sección actual. |
| ProductSearchComponent | Campo Material, sugerencias, F2 y selección accesible. |
| ProductQuickFiltersComponent | Colecciones y categorías; emitir intención de filtrado. |
| ProductFilterPanelComponent | Formulario reactivo tipado y chips activos. |
| ProductResultsComponent | Estados, conteo, lista/cuadrícula y paginación. |
| ProductRowComponent / ProductTileComponent | Misma información y eventos tipados; conservar y adaptar el tile existente para cuadrícula. |
| ProductSearchStore / adapter | Consulta remota, cancelación, caché y transformación a modelos de vista. |
| ScannerInputController | Delimitar lecturas y emitir intenciones exactas sin mezclar búsquedas de texto. |

Reutilizar ui-button, ui-icon-button, ui-money, estados y tokens disponibles; verificar qué primitivas están implementadas antes de introducir otras. Mantener todas estas piezas de dominio en counter-sales. No realizar HTTP desde componentes ni modificar archivos generados.

Usar Signals para consulta/filtros/selección/estado; RxJS para temporización y cancelación. Ubicar la cancelación antes del periodo de espera para invalidar inmediatamente la búsqueda anterior. Asociar loading/errores a la versión vigente; una finalización antigua no debe apagar el indicador de la nueva consulta. Manejar errores dentro del flujo para que la siguiente búsqueda siga funcionando.

Componentes presentacionales con OnPush explícito para el baseline Angular 21 e identidad estable por ID. Angular documenta cómo OnPush limita la comprobación de subárboles: [Skipping component subtrees](https://angular.dev/best-practices/skipping-subtrees). Mantener versión major del proyecto.

Slices propuestos, cada uno con su contrato y verificación:

1. Backend: búsqueda paginada POS y resolución exacta, índices medidos, pruebas de relevancia/stock/seguridad y OpenAPI. No modifica inventario.
2. Frontend: lista compacta, búsqueda remota, paginación, estados, F2, flechas/Enter/Esc y lector. Verificar que un producto fuera de los primeros 100 sea encontrable.
3. Accesos rápidos y descubrimiento: favoritos, más vendidos, categorías, marca, filtros y sugerencias, una vez disponibles sus contratos.
4. QA operativa: escaneos consecutivos, respuestas fuera de orden, recuperación de errores, stock cambiante, teclado y responsive. Registrar evidencia real antes de declarar la implementación terminada.

Pruebas de aceptación: búsqueda por cada criterio solicitado; «coca 600» y «arz» con resultados esperados en datos controlados; cero resultados reales; solicitud antigua lenta; Enter durante carga; dos escaneos iguales suman dos; una lectura no duplica; producto agotado; cambio de almacén; conservación del carrito y consulta; favoritos vacíos; rango inválido; categorías numerosas; nombres largos y zoom. Playwright en móvil/tablet/desktop, más revisión de los viewports exigidos por el sistema de diseño. Al implementar ejecutar lint, pruebas y build, y verificar PostgreSQL y OpenAPI si se modifica backend.

## Entrega y límites

Esta entrega define diseño, distribución, componentes, estados, teclado/lector, escalabilidad, responsive y estrategia frontend/backend. No se ha implementado ni ejecutado un benchmark, build o prueba visual de la nueva interfaz. No hay migraciones, endpoints ni Domain Events nuevos en esta propuesta. Las brechas de contrato quedan enumeradas para convertirlas en slices verificables.
