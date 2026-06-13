# Política de privacidad

Guardian Senior AI Secure v4 está diseñada para funcionar de forma local.

## Datos que puede guardar

- Nombre de la persona mayor.
- Teléfonos de familiares o cuidadores.
- Mensaje de emergencia.
- Medicación o notas médicas introducidas por la familia.
- Registro mínimo de eventos.
- Hash del PIN familiar generado con PBKDF2-SHA256 y sal aleatoria.

## Dónde se guardan

Los datos se guardan en el navegador del dispositivo mediante `localStorage`.

## Qué datos se envían a internet

La app no envía datos a servidores propios, no incluye analíticas y no usa cookies externas.

Cuando se pulsa “Enviar SMS”, el sistema del teléfono prepara un SMS con el mensaje de emergencia. Si el usuario concede permiso de ubicación, se añade un enlace de Google Maps al mensaje.

## Ubicación

La ubicación no se pide al abrir la app. Solo se solicita cuando se activa una emergencia o una prueba de SMS.

## Borrado de datos

La app incluye una opción de borrado total para eliminar configuración, PIN, medicación e historial del dispositivo.

## Aviso médico y legal

Esta app no sustituye a servicios de emergencia, teleasistencia profesional, atención médica ni dispositivos certificados de detección de caídas.
