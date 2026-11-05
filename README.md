# Fit

Aplicación web para llevar el registro de **peso, calorías y macros**, con el
seguimiento organizado **semana a semana**.

Funciona sin servidor ni cuentas: todos los datos se guardan en el navegador
(`localStorage`) y se pueden exportar o importar cuando quieras.

## Qué hace

| Pantalla | Para qué sirve |
| --- | --- |
| **Hoy** | Anillo de calorías, barras de macros, peso del día, racha y adherencia de la semana. |
| **Diario** | Registro por desayuno / comida / cena / snack, con buscador de alimentos, entrada rápida y opción de copiar el día anterior. |
| **Peso** | Alta de pesajes, gráfica con media móvil de 7 días, tendencia real en kg/semana e historial. |
| **Semanas** | El núcleo: tabla comparativa semana a semana, peso medio, cambio real, calorías y macros medios, balance energético y desglose día a día. |
| **Alimentos** | Biblioteca propia con ~45 alimentos comunes precargados, favoritos y alta/edición de los tuyos. |
| **Ajustes** | Perfil, objetivo, reparto de macros, tema, exportar/importar y borrado de datos. |

## Cómo calcula tus números

1. **Metabolismo basal (TMB)** con la fórmula de Mifflin-St Jeor.
2. **Gasto diario (TDEE)** = TMB × factor de actividad (1.2 a 1.9).
3. **Objetivo calórico** = TDEE ± el ajuste que corresponde a tu ritmo semanal
   (1 kg de peso ≈ 7700 kcal, así que −0,5 kg/semana son −550 kcal/día).
   Hay un suelo de seguridad: nunca propone bajar del 60 % de tu gasto.
4. **Macros**: la proteína y la grasa se fijan en g/kg de peso corporal y los
   carbohidratos absorben las calorías restantes.

Puedes sobrescribir el objetivo calórico a mano en Ajustes.

En la vista de semanas, el **cambio esperado** se calcula contra tu gasto
estimado (no contra el objetivo), de modo que refleja el déficit o superávit
que realmente registraste. Compararlo con lo que marca la báscula es la forma
práctica de ajustar el plan: si durante 2-3 semanas la realidad no cuadra con
la estimación, lo que hay que corregir es el objetivo calórico.

## Uso

Requiere Node 18 o superior.

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # pruebas del núcleo de cálculo
npm run build    # build de producción en dist/
npm run preview  # sirve el build
```

## En el móvil

Está pensada para el teléfono: incluye manifest e iconos, así que desde el
navegador puedes usar **«Añadir a pantalla de inicio»** y se abre como una app.
Un service worker cachea la interfaz, por lo que sigue funcionando sin conexión.

## Despliegue

El workflow `.github/workflows/deploy.yml` publica en GitHub Pages en cada push
a `main`. Para activarlo: **Settings → Pages → Source: GitHub Actions**.

Para servir desde una subruta, el build acepta la variable `APP_BASE`:

```bash
APP_BASE=/fit/ npm run build
```

Para empaquetar la app en un solo HTML autocontenido (útil para visores que no
sirven archivos sueltos), usa `VITE_EMBEBIDO=1 npm run build` y mete el CSS y el
JS de `dist/assets/` dentro del HTML. Esa bandera omite el service worker y los
botones de descarga, que no funcionan en un visor restringido; la copia al
portapapeles sigue disponible como respaldo.

## Tus datos

Todo vive en el navegador donde lo usas. No hay servidor, no se envía nada a
ningún sitio y no hay sincronización entre dispositivos. Eso implica que si
borras los datos del navegador, pierdes el historial: usa **Ajustes → Exportar
respaldo (JSON)** de vez en cuando. Ese mismo archivo sirve para llevarte el
historial a otro dispositivo con **Importar**.

## Estructura

```
src/
  lib/            Núcleo sin dependencias de UI (con pruebas)
    types.ts        Modelo de datos
    dates.ts        Fechas y semanas ISO en horario local
    nutricion.ts    TMB, TDEE, objetivos y reparto de macros
    estadisticas.ts Agregados diarios, resumen semanal, media móvil, tendencia
    almacen.ts      Persistencia, normalización, exportación
    alimentosBase.ts Biblioteca inicial de alimentos
  state/store.tsx Contexto + reducer de la aplicación
  components/     Tarjetas, métricas, barras y gráficas SVG propias
  pages/          Una por sección de la navegación
```

Las gráficas están escritas a mano en SVG y miden el ancho real de su
contenedor, así que no hay librería de charts ni texto deformado en móvil.

## Aviso

Las estimaciones son orientativas y los valores nutricionales precargados son
aproximados. Esto no sustituye el criterio de un profesional de la salud.
