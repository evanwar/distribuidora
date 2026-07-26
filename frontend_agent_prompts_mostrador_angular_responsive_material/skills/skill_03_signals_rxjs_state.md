# Skill 03 - Signals y RxJS

## Signals

Usar para:

- estado de página/feature;
- selección actual;
- loading/error;
- datos derivados con `computed`;
- estado de carrito.

## RxJS

Usar para:

- HTTP;
- debounce de búsqueda;
- cancelación con `switchMap`;
- combinación temporal de streams;
- eventos WebSocket futuros si se aprueban.

## Reglas

- No convertir todo a Observable ni todo a Signal por dogma.
- Evitar `effect` para derivar datos; usar `computed`.
- No mutar arrays/objetos dentro de signals sin producir nuevo valor.
- Cancelar requests de búsqueda anteriores.
- Exponer estado readonly.
