# Changelog

## v6.1

- Añadido botón **Llamar 112** dentro del modal SOS.
- Corregido contraste de botones primarios en modo alto contraste.
- Nuevas instalaciones: PIN mínimo de 6 dígitos.
- Compatibilidad de desbloqueo con PIN heredado de 4 dígitos.
- Añadido bloqueo automático por inactividad y cambio de pestaña/app.
- Saneado de textos usados en mensajes de emergencia.
- Mejorada caché PWA con versión v6.1 y fallback offline de navegación.
- Añadido `.nojekyll` para GitHub Pages.

## v6

- Añadido diagnóstico interno de compatibilidad.
- Añadido aviso de entorno inseguro o incompleto.
- Mejorado flujo SOS: el modal se abre antes de esperar ubicación.
- Añadido SMS a familiar secundario.
- Añadidos iconos PNG 192/512 para PWA.
- Mejorado alto contraste.
- Añadida ayuda de instalación en iPhone.
- Añadido plan de pruebas.
- Endurecido manejo de `localStorage` y JSON.
- Mejorada migración desde v5/v4.
- Subida PBKDF2 a 210.000 iteraciones.

## v5

- Notas médicas cifradas con AES-GCM.
- Corrección para no cargar notas médicas en pantalla bloqueada.

## v4

- PIN PBKDF2 + sal.
- Límite de intentos.
- Botón llamar 112.
