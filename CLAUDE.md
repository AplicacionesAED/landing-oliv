# landing-oliv

Micrositio en React + Vite + TypeScript del macroproyecto inmobiliario Oliv, desplegado en Cloudflare Workers (Static Assets). A diferencia de las otras dos landings de la marca (`landing-invierte-oliv`, `landing-vive-oliv`), este sitio **no es una landing comercial**: la ruta `/` redirige a `/politica-de-tratamiento-de-datos` (manual legal de tratamiento de datos personales del proyecto) y expone además el brochure digital interactivo del proyecto en `/brochure-digital` y `/brochure-digital-mobile`.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build     # genera ./dist
npx wrangler deploy   # despliegue manual a Cloudflare Workers (no hay script "deploy" en package.json)
```

## Generación de material comercial (brochures PDF)

Con `npm run dev` corriendo en paralelo:

```bash
node capture-slides.cjs        # captura PNG de cada slide de /brochure-digital
node create-pdf.cjs             # genera "Oliv Brochure.pdf" (desktop)
node create-pdf-mobile.cjs      # genera "Oliv Brochure Mobile.pdf" (mobile)
```

Si se agrega o quita una slide en `src/app/pages/brochure-slides.html` o `brochure-slides-mobile.html`, actualizar la constante `TOTAL_SLIDES` en los tres scripts anteriores.

## Documentación técnica

Existe una documentación técnica del proyecto Oliv (que cubre este sitio junto con las otras 2 landing pages de la marca) en:

`C:\Users\GabrielEliasValdelam\Desktop\Documentaciones\Documentacion-Tecnica-Oliv.md`

**Mantenla actualizada automáticamente**: cuando hagas un cambio significativo en este sitio (nueva sección, cambio de stack, cambio de despliegue/dominio, nuevo script de generación de materiales), actualiza en ese mismo cambio la sección correspondiente de ese documento -- no esperes a que te lo pidan aparte.
