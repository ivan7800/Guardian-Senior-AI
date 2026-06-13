# Seguridad

## Modelo de seguridad

Guardian Senior AI Secure v6 es una PWA local. No tiene backend, base de datos remota ni cuentas de usuario.

## Medidas incluidas

- Política CSP básica en `index.html`.
- Sin scripts externos.
- Sin estilos externos.
- `connect-src 'none'` para evitar conexiones de red desde la app.
- PIN familiar con PBKDF2-SHA256 + sal.
- Notas médicas cifradas con AES-GCM.
- Límite de intentos de PIN.
- Borrado total protegido por PIN.
- Registro mínimo de eventos.
- No carga notas médicas en el DOM mientras la app está bloqueada.

## Decisión consciente

Los teléfonos familiares no se cifran para permitir llamadas y SMS sin PIN durante una emergencia. Esto es un equilibrio entre privacidad y utilidad de emergencia.

## Recomendaciones antes de uso real

- Usar HTTPS, por ejemplo GitHub Pages.
- Probar en el iPhone real de la persona mayor.
- Probar llamada al familiar, SMS, ubicación y Atajo de Siri.
- No guardar más datos médicos de los imprescindibles.
- Revisar el dispositivo periódicamente.
- Mantener iOS/Android actualizado.

## Límites

- Cualquier persona con acceso desbloqueado al dispositivo podría manipular la app.
- `localStorage` no es una caja fuerte contra atacantes con acceso físico o malware.
- No hay monitorización automática de caídas.
- No sustituye a teleasistencia profesional ni a dispositivos certificados.

## Reporte de fallos

Si publicas este proyecto, abre issues en GitHub para reportar fallos de seguridad o privacidad. No incluyas datos personales reales en los reportes.
