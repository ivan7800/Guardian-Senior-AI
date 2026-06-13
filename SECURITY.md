# Seguridad

## Modelo de seguridad

Guardian Senior AI Secure v4 evita servidores externos y guarda datos en el dispositivo. La configuración sensible queda detrás de un PIN familiar.

## Medidas incluidas

- Sin analíticas externas.
- Sin cookies externas.
- Sin IA externa por defecto.
- CSP básica en `index.html`.
- Ajustes protegidos con PIN.
- PIN con PBKDF2-SHA256 + sal + 150.000 iteraciones.
- Límite de intentos de PIN.
- Teléfonos enmascarados en pantalla.
- Registro mínimo de eventos.
- Borrado total de datos.
- SOS sin PIN para no bloquear una emergencia.
- La ubicación no se solicita al cargar la app.

## Limitaciones

- `localStorage` no es equivalente a una base de datos cifrada.
- Cualquier persona con acceso físico al dispositivo desbloqueado puede usar el SOS.
- Un atacante con acceso completo al dispositivo o al navegador puede extraer datos locales.
- La app no está certificada como producto sanitario ni como sistema de teleasistencia.

## Recomendaciones antes de uso real

- Probar llamadas y SMS en cada iPhone/Android concreto.
- No guardar más información médica de la necesaria.
- Configurar bloqueo del dispositivo con código/Face ID/Touch ID.
- Mantener activas funciones nativas como Emergencia SOS, Contactos de emergencia y detección de caídas del Apple Watch si está disponible.
