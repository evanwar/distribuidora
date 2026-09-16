# ADR-002: Driver.js para tutoriales modulares

## Estado

Aceptado.

## Contexto

La aplicación necesita ayuda guiada por módulo para personas que operan ventas, inventario, compras, cobranza y administración. La solución debe señalar controles existentes, funcionar en la SPA Angular, respetar permisos y no ejecutar mutaciones de negocio.

## Decisión

Se incorpora `driver.js` 1.8.x como dependencia de producción. La biblioteca se carga dinámicamente desde `TutorialOrchestratorService`; ningún componente de negocio la importa. Las definiciones son datos tipados, usan selectores semánticos `data-tour`, textos localizados y progreso local versionado.

Driver.js aporta overlay, posicionamiento, navegación por teclado y ciclo de vida. Angular Material continúa siendo el único sistema de componentes: el launcher y centro usan Material; el popover externo se personaliza únicamente con tokens del producto.

## Alternativas consideradas

- Implementación propia con CDK Overlay: máximo control, pero mayor coste de posicionamiento, scroll, viewport y mantenimiento.
- Intro.js/Shepherd: resuelven un problema similar, pero no ofrecen una ventaja suficiente para justificar mayor integración o licencia/huella distinta.
- Ayuda estática: accesible y simple, pero no conecta la explicación con la pantalla. Se conserva como información textual dentro del centro de tutoriales.

## Seguridad y privacidad

- Las descripciones son literales confiables; no interpolan datos de usuarios o documentos.
- El progreso local contiene solo ID, versión, estado, último paso y fecha.
- Los tours no invocan API ni hacen click sobre acciones transaccionales.
- El registro de telemetría es no-op y no captura PII.

## Accesibilidad y responsive

El launcher y centro son Material y operables por teclado. El popover tiene foco visible, etiquetas localizadas, ancho fluido, contraste basado en tokens y reducción de movimiento. Si una limitación del overlay impide a una persona completar el recorrido, el centro mantiene título, descripción, estado y acceso repetible a cada guía.

## Impacto y mantenimiento

La carga dinámica evita añadir Driver.js al camino inicial del shell. Cada recorrido tiene ID y versión estables. Los selectores forman un contrato DOM explícito que debe actualizarse junto con la pantalla y sus pruebas.

## Estrategia de retirada

La dependencia está encapsulada en un único servicio. Para sustituirla se conserva el registro, progreso, UI y selectores; solo se reemplaza el adaptador del orquestador y se retiran el CSS/import de Driver.js.

