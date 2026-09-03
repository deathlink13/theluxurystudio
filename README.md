# The Luxury Studio - sitio local

## API conectada

El sitio apunta a:

`https://script.google.com/macros/s/AKfycbw2ZMnJSM8zwMBQLMg_9k_cJMZlPhZiC82c1rMbZaXe8K52GV0Hz_qMg7ru8pZcdVA/exec`

## Abrir en Windows

La forma recomendada para probar la agenda localmente es hacer doble clic en `INICIAR_SITIO.bat`.

También puedes abrir una terminal en esta carpeta y ejecutar:

```bash
npm start
```

Después abre `http://localhost:4173/`.

El servidor local incluye un puente `/api/luxury` hacia Google Apps Script. Esto permite que el navegador lea las respuestas JSON de disponibilidad y confirmación sin depender del comportamiento CORS de Google Apps Script.

## Carpetas

- `assets/css/` - estilos
- `assets/js/` - configuración y lógica de la agenda
- `assets/images/` - imágenes y logotipo
- `docs/` - documentación auxiliar

No necesitas modificar la URL de la API: ya está escrita en `assets/js/config.js` y en `server.mjs`.
