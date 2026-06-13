# Guardian Senior AI Secure v4

PWA local para ayudar a personas mayores a pedir ayuda rápidamente desde un móvil, con privacidad y seguridad por diseño.

## Funciones

- Botón SOS enorme.
- Botón directo para llamar al 112.
- Llamada a familiar 1 y familiar 2.
- SMS con mensaje de emergencia y ubicación opcional.
- Modo mayor con interfaz simplificada.
- Alto contraste.
- Reconocimiento de voz si el navegador lo permite.
- Atajo de iPhone mediante enlace `?sos=1`.
- Configuración familiar protegida con PIN.
- PIN guardado con PBKDF2-SHA256 + sal + límite de intentos.
- Teléfonos enmascarados en pantalla.
- Registro mínimo local.
- Exportación y borrado del registro.
- Borrado total de datos.
- PWA instalable y offline básica.

## Seguridad y privacidad

- No hay servidores propios.
- No hay analíticas.
- No hay cookies externas.
- No hay IA externa por defecto.
- La ubicación no se pide al cargar: solo al activar emergencia o prueba.
- Incluye CSP básica en `index.html`.
- Los datos se guardan en `localStorage` del dispositivo.

## Limitaciones

- No sustituye al 112, teleasistencia profesional, atención médica ni Apple Watch.
- `localStorage` no es cifrado fuerte.
- El envío de SMS depende del navegador y sistema operativo.
- Para uso médico real se necesita auditoría profesional y posiblemente app nativa.

## Atajo de iPhone

1. Sube la app a GitHub Pages o ábrela en Safari.
2. Copia el enlace SOS que muestra la app.
3. Abre Atajos en iPhone.
4. Crea un atajo llamado “Necesito ayuda”.
5. Añade la acción “Abrir URL”.
6. Pega el enlace SOS.
7. Di: “Oye Siri, necesito ayuda”.

## GitHub Pages

Sube todos los archivos a un repositorio y activa GitHub Pages en la rama principal.
