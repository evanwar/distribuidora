---
project: Distribuidora Frontend - MVP Mostrador
quality_gate: endpoint coverage + component composition + intuitive UX
---

# WF07 - Auditoría de composición, mantenibilidad y UX

## Propósito

Cerrar cada módulo con evidencia de que integra su contrato, reutiliza el sistema de componentes y ofrece una experiencia coherente. “Estético” se evalúa por jerarquía, consistencia, legibilidad y detalle; “intuitivo” por descubribilidad, feedback, prevención/recuperación de errores y continuidad de tarea.

## Paso 1 - Trazabilidad funcional

Para cada ID asignado en `06_MATRIZ_ENDPOINTS_FRONTEND.md` verificar:

```text
endpoint -> generated client -> adapter -> mapper -> facade/store
         -> page/action -> estados UI -> permiso -> prueba
```

No aprobar operaciones sin consumidor ni pruebas. Un endpoint legítimamente transversal debe nombrar a sus consumidores.

## Paso 2 - Inventario de componentes

- Listar primitivas `shared/ui` reutilizadas.
- Listar patrones `shared/patterns` reutilizados.
- Listar componentes nuevos y su owner.
- Comparar componentes nuevos por responsabilidad y API, no solo por nombre.
- Detectar markup/SCSS duplicado para botones, encabezados, action bars, status chips, alertas, empty states, filtros y data views.
- Confirmar que componentes presentacionales no inyectan HTTP ni clientes generados.
- Confirmar que ningún componente compartido contiene DTOs o reglas de negocio.

Si hay duplicación, consolidar mediante configuración tipada. Si la similitud es solo visual y la semántica difiere, conservar composición local sobre las mismas primitivas.

## Paso 3 - Contratos de customización

Verificar que cada componente configurable:

- expone inputs/outputs con tipos cerrados y nombres semánticos;
- usa `tone`, `variant`, `size`, estado e icono aprobados;
- no expone hex, selectores internos, clases o estilos arbitrarios;
- documenta defaults y combinaciones válidas;
- cubre normal, loading, empty/error cuando aplique, disabled, focus y permiso;
- tiene pruebas de eventos y prevención de doble acción.

Para botones, comprobar que cambiar texto, tono, icono o loading no exige copiar plantilla ni SCSS.

## Paso 4 - Revisión heurística de UX

Ejecutar cada flujo con una persona que conoce la tarea, no la estructura del código:

```text
[ ] entiende dónde comenzar por el título y la acción primaria
[ ] encuentra clientes/proveedores/productos por su nombre de negocio
[ ] distingue acción primaria, secundaria y destructiva
[ ] sabe qué filtros están activos y cómo limpiarlos
[ ] conserva contexto al volver de detalle/edición
[ ] recibe feedback inmediato al enviar
[ ] entiende qué ocurrió ante error y cómo recuperarse
[ ] no pierde datos capturados por un error recuperable
[ ] puede completar el flujo con teclado y con touch
[ ] no necesita conocer endpoints, controladores o términos técnicos
```

Registrar fricciones y corregir las que provoquen duda, pasos redundantes o riesgo operativo.

## Paso 5 - Revisión de calidad visual

- Comparar títulos, espacios, densidad, alineación, radios, elevación e iconografía contra tokens.
- Mantener una acción primaria por contexto.
- Reducir superficies anidadas y ruido visual.
- Revisar textos reales largos, folios, SKU, importes grandes, cero datos y errores.
- Validar skeleton/loading sin saltos abruptos.
- Validar estados hover, focus, pressed, selected y disabled.
- Confirmar contraste WCAG AA y `prefers-reduced-motion`.
- Capturar móvil, tableta y escritorio con datos deterministas.

No aprobar una pantalla por “verse moderna” si sacrifica velocidad, lectura o descubribilidad.

## Paso 6 - Mantenibilidad

```text
[ ] rutas y carpetas usan topics de negocio
[ ] no hay imports profundos entre features
[ ] page, UI, data-access, modelos y tests tienen ownership claro
[ ] no hay mega componentes/formularios universales
[ ] no hay lógica compleja en templates
[ ] ViewModels aíslan DTOs generados
[ ] cambios visuales comunes se resuelven en tokens/primitivas
[ ] nueva dependencia o abstracción mayor tiene ADR
```

## Evidencia de salida

```md
## Cobertura
IDs integrados, bloqueados y evidencia.

## Reutilización
Primitivas/patrones usados y componentes nuevos.

## UX
Flujos revisados, fricciones y correcciones.

## Visual
Viewports, estados y capturas comparadas.

## Mantenibilidad
Duplicación/imports/ownership y resultado.

## Estado
Aprobado | Rechazado con acciones concretas.
```

Un módulo no avanza a “terminado” con endpoints pendientes, duplicación evitable, navegación por términos técnicos o defectos visuales/funcionales de prioridad alta.

