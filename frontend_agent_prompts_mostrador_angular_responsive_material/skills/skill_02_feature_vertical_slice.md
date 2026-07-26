# Skill 02 - Feature-first y Vertical Slice UI

## Regla

Una historia se entrega de extremo a extremo, no por capas horizontales.

## Contenido del slice

```text
route
page/container
ui components
store/facade
api adapter
mappers/view models
validation
permissions
error handling
tests
endpoint IDs de la matriz
contratos de componentes reutilizados
```

## Criterio

El slice debe poder demostrarse y probarse sin esperar a que otro agente complete una capa genérica.

## Dependencias

Publicar solo lo indispensable desde cada feature. Reutilizar las primitivas F0; mantener componentes de dominio en la feature y promoverlos a `shared/patterns` solo después de dos usos reales.
