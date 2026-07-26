# Skill 08 - Testing y calidad

## Pirámide

- Unitarias para mappers, stores y validadores.
- Component tests para formularios y UI compleja.
- HTTP tests para adapters.
- E2E para flujos críticos.
- Pruebas responsive en móvil, tableta y escritorio.
- Regresión visual solo para pantallas estables y datos deterministas.
- Contract tests para inputs/outputs y variantes de primitivas compartidas.
- Auditoría de cobertura endpoint: operación -> adapter -> consumidor -> prueba.

## Herramientas

- Vitest con Angular TestBed.
- `provideHttpClientTesting` para HTTP.
- Angular Material Harnesses cuando aporten estabilidad.
- Playwright para E2E, emulación de dispositivos, screenshots y verificación de overflow.
- Angular Material Harnesses para evitar selectores frágiles.

## Gate

```text
npm ci
npm run lint
ng test --watch=false
ng build --configuration production
npm run e2e
```

No perseguir cobertura numérica vacía; cubrir riesgos de inventario, dinero, permisos, doble envío, pérdida de acciones en móvil, overflow, foco y overlays fuera del viewport. Ejecutar también `workflows/WF06_validacion_material_responsive.md`.
