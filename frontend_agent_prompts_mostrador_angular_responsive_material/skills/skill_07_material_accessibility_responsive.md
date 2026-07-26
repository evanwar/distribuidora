# Skill 07 - Angular Material, Material Design 3, accesibilidad y responsive

## Instrucción del agente

Antes de crear o modificar UI, leer `05_DESIGN_SYSTEM_MATERIAL_RESPONSIVE.md` y `07_ARQUITECTURA_COMPONENTES_UX.md`. Este skill es obligatorio para cualquier slice con salida visual.

## Angular Material como sistema único

- Usar Angular Material y CDK como base de todos los controles, overlays, navegación y feedback.
- Mantener tema Material 3 centralizado.
- No agregar una segunda librería visual.
- No recrear componentes Material con CSS artesanal.
- No envolver cada componente Material sin aportar comportamiento real.
- Reutilizar las primitivas compartidas configurables cuando concentren loading, permisos, accesibilidad, estados o responsive.
- No copiar un botón/componente para cambiar texto, tono, icono o tamaño.
- Usar tokens del tema; evitar colores, radios, sombras y spacing dispersos.

## Mobile-first y 100% responsive

- Empezar por 320 px y escalar progresivamente.
- Probar móvil, tableta, laptop y escritorio.
- No depender de ancho fijo.
- No permitir overflow horizontal global.
- Mantener funciones críticas disponibles en todos los tamaños.
- Elegir estrategia responsive explícita para tablas, formularios, diálogos y navegación.
- Usar CSS Grid/Flex/container queries; reservar `BreakpointObserver` para cambios de comportamiento.

## Material responsive

- Sidenav `over` en móvil y persistente/colapsable en escritorio.
- Formularios Material a una columna en móvil.
- Acciones de fila secundarias dentro de `mat-menu` en móvil.
- Diálogos largos fullscreen o convertidos en página en móvil.
- Touch targets aproximados de 48 × 48 px.
- `mat-form-field` fluido y sin cortes de label/error.

## Accesibilidad

- Labels asociados y nombres accesibles.
- Orden de tabulación y DOM lógico.
- Foco visible y restaurado tras overlays.
- Estados no comunicados solo por color.
- Mensajes de error vinculados al campo.
- Atajos documentados y sin conflicto.
- Contraste WCAG AA.
- Gráficas con alternativa textual/tabular.

## Evidencia requerida

El agente debe reportar:

```text
viewports probados
estrategia responsive elegida
componentes Material utilizados
resultado de overflow/foco/teclado
evidencia Playwright o screenshots de pantallas críticas
```

## Rechazar la entrega si

- solo funciona en escritorio;
- oculta acciones críticas en móvil;
- usa inputs/botones no Material sin justificación;
- introduce Bootstrap/Tailwind/PrimeNG/u otra librería;
- rompe a 320 px, orientación horizontal o zoom 200%;
- usa scroll horizontal de toda la página;
- comunica estados únicamente por color.
