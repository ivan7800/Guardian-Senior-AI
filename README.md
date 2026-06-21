# Guardian Senior AI Secure v6.1

Prototipo PWA local para ayudar a personas mayores a pedir ayuda de forma rápida desde iPhone, Android o navegador.

## Funciones principales

- Botón grande **PEDIR AYUDA**.
- Botón directo **LLAMAR 112**.
- Botón **ESTOY BIEN** con registro local mínimo.
- Aviso familiar por llamada y SMS.
- Mensaje de emergencia con ubicación opcional.
- Atajo de iPhone/Siri mediante enlace `?sos=1`.
- PIN familiar reforzado: nuevos PIN de 6–8 dígitos, PBKDF2 + sal y compatibilidad de desbloqueo con PIN heredado.
- Notas médicas cifradas con AES-GCM y bloqueo automático de ajustes sensibles.
- Teléfonos ocultos parcialmente en pantalla.
- Modo mayor y alto contraste.
- Diagnóstico interno de compatibilidad.
- PWA instalable y offline-first.

## Uso recomendado

1. Sube la carpeta a GitHub Pages o abre `index.html` en un navegador moderno.
2. Crea el PIN familiar nuevo de 6–8 dígitos.
3. Configura al menos un teléfono familiar.
4. Haz una prueba real de llamada, SMS y ubicación.
5. En iPhone, añade la app a pantalla de inicio desde Safari.
6. Crea un Atajo de Siri que abra el enlace SOS mostrado por la app.

## Importante

Esta app **no sustituye al 112**, a un Apple Watch con detección de caídas, a teleasistencia profesional ni a atención médica. Es un prototipo de ayuda familiar.

## Privacidad

La app no usa servidores, analíticas, anuncios, cookies externas ni IA externa. Los datos se guardan en el navegador del dispositivo. Si la publicas en GitHub Pages, la app sigue sin enviar datos, aunque la plataforma de hosting puede tener registros técnicos propios.

## Limitaciones

- La app ayuda a iniciar llamadas/SMS; no puede garantizar que el sistema operativo envíe un SMS automáticamente.

- Los SMS y llamadas dependen del sistema operativo.
- La ubicación requiere permiso del usuario.
- El dictado de voz no funciona igual en todos los navegadores; en iPhone es mejor usar Siri + Atajos.
- Si se pierde el PIN, las notas médicas cifradas no se pueden recuperar.

## Archivos

- `index.html`: interfaz.
- `style.css`: diseño responsive y accesible.
- `app.js`: lógica local, PIN, cifrado, SOS y diagnóstico.
- `manifest.json`: instalación PWA.
- `sw.js`: funcionamiento offline.
- `PRIVACY.md`: privacidad.
- `SECURITY.md`: seguridad.
- `TESTING.md`: plan de pruebas.
- `CHANGELOG.md`: cambios.

## Licencia

MIT. Úsala con responsabilidad.

## Cambios clave de v6.1

- 112 añadido al modal de emergencia para que el flujo SOS nunca dependa solo de familiares.
- Alto contraste corregido: texto negro sobre botón amarillo primario y botones críticos legibles.
- Nuevo PIN mínimo de 6 dígitos para instalaciones nuevas.
- Bloqueo automático de ajustes sensibles por inactividad y al cambiar de pestaña/app.
- Mensajes de emergencia saneados para evitar saltos de línea/control inesperados en SMS.
- Service Worker actualizado con caché v6.1, limpieza de cachés antiguas y fallback offline de navegación.
- Añadido `.nojekyll` para publicación limpia en GitHub Pages.
