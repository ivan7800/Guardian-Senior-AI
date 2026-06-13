# Privacidad

Guardian Senior AI Secure v6 está diseñada como app local y offline-first.

## Qué datos puede guardar

- Nombre de la persona mayor.
- Teléfonos familiares.
- Mensaje de emergencia.
- Notas médicas esenciales.
- Registro local mínimo de eventos.
- Preferencias visuales.

## Dónde se guardan

Los datos se guardan en `localStorage` del navegador del dispositivo.

## Qué se cifra

Las notas médicas se cifran con AES-GCM usando una clave derivada del PIN familiar mediante PBKDF2 + sal.

## Qué no se cifra por diseño

Los teléfonos familiares se guardan localmente sin cifrar para que la app pueda llamar o preparar SMS de emergencia sin pedir PIN. En pantalla se muestran ocultos parcialmente.

## Qué no hace la app

- No usa servidores propios.
- No usa analíticas.
- No usa cookies externas.
- No usa anuncios.
- No envía conversaciones a una IA externa.
- No solicita ubicación al abrir la app.

## Ubicación

La ubicación solo se solicita al activar una emergencia o una prueba de SMS. Si el usuario rechaza el permiso, el aviso se genera sin ubicación.

## Borrado de datos

La app incluye un botón de borrado total protegido por PIN. El borrado elimina configuración, PIN, notas médicas e historial local del navegador.

## Nota sobre hosting

Si la app se publica en GitHub Pages u otro hosting, la app no envía datos personales desde el código, pero el proveedor de hosting puede registrar accesos técnicos como IP, fecha o navegador.
