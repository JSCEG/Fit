import { useMemo } from 'react'
import { usarAncho } from './usarAncho'

export interface PuntoSerie {
  x: string
  y: number | null
}

export interface Serie {
  nombre: string
  color: string
  puntos: PuntoSerie[]
  /** Linea discontinua, util para medias moviles. */
  discontinua?: boolean
  /** Dibuja un circulo en cada punto. */
  marcadores?: boolean
}

const M = { arriba: 14, derecha: 12, abajo: 26, izquierda: 42 }

/**
 * Indices de etiquetas a dibujar en el eje X. Se reparten uniformemente y la
 * ultima solo se anade si no queda pegada a la anterior.
 */
function indicesEtiquetas(n: number, paso: number): Set<number> {
  const indices = new Set<number>()
  for (let i = 0; i < n; i += paso) indices.add(i)
  const ultima = n - 1
  const anterior = Math.max(...indices)
  if (ultima - anterior >= paso * 0.7) indices.add(ultima)
  else if (ultima !== anterior) {
    indices.delete(anterior)
    indices.add(ultima)
  }
  return indices
}


/**
 * Grafica de lineas en SVG puro. El eje X es categorico (una posicion por
 * etiqueta) para que las series compartan escala aunque falten valores.
 */
export function GraficaLineas({
  series,
  etiquetas,
  alto = 200,
  formatoY = (v: number) => String(Math.round(v)),
  lineaObjetivo,
  etiquetaObjetivo,
  minForzado,
  maxForzado,
}: {
  series: Serie[]
  etiquetas: string[]
  alto?: number
  formatoY?: (v: number) => string
  lineaObjetivo?: number
  etiquetaObjetivo?: string
  minForzado?: number
  maxForzado?: number
}) {
  const [ref, ancho] = usarAncho<HTMLDivElement>()
  const dibujoAncho = Math.max(60, ancho - M.izquierda - M.derecha)
  const dibujoAlto = alto - M.arriba - M.abajo

  const { min, max } = useMemo(() => {
    const valores = series
      .flatMap((s) => s.puntos.map((p) => p.y))
      .filter((v): v is number => v !== null && Number.isFinite(v))
    if (lineaObjetivo !== undefined) valores.push(lineaObjetivo)
    if (valores.length === 0) return { min: 0, max: 1 }
    let lo = minForzado ?? Math.min(...valores)
    let hi = maxForzado ?? Math.max(...valores)
    if (lo === hi) {
      lo -= 1
      hi += 1
    }
    const margen = (hi - lo) * 0.12
    return { min: (minForzado ?? lo - margen), max: (maxForzado ?? hi + margen) }
  }, [series, lineaObjetivo, minForzado, maxForzado])

  const n = Math.max(etiquetas.length, 1)
  const px = (i: number) => (n === 1 ? dibujoAncho / 2 : (i / (n - 1)) * dibujoAncho)
  const py = (v: number) => dibujoAlto - ((v - min) / (max - min)) * dibujoAlto

  const marcasY = useMemo(() => {
    const cuantas = 4
    return Array.from({ length: cuantas + 1 }, (_, i) => min + ((max - min) * i) / cuantas)
  }, [min, max])

  // El numero de etiquetas depende del ancho disponible para que no se solapen.
  const maxEtiquetas = Math.max(2, Math.floor(dibujoAncho / 58))
  const pasoX = Math.max(1, Math.ceil(n / maxEtiquetas))
  const visiblesX = indicesEtiquetas(n, pasoX)

  if (etiquetas.length === 0) return null

  const svg = (
    <svg
      className="grafica"
      width={ancho}
      height={alto}
      viewBox={`0 0 ${ancho} ${alto}`}
      role="img"
      aria-label={series.map((s) => s.nombre).join(', ')}
    >
      <g transform={`translate(${M.izquierda},${M.arriba})`}>
        {marcasY.map((v, i) => (
          <g key={i}>
            <line className="rejilla-linea" x1={0} y1={py(v)} x2={dibujoAncho} y2={py(v)} />
            <text x={-8} y={py(v) + 3} textAnchor="end">
              {formatoY(v)}
            </text>
          </g>
        ))}

        {lineaObjetivo !== undefined && (
          <>
            <line
              className="objetivo"
              x1={0}
              y1={py(lineaObjetivo)}
              x2={dibujoAncho}
              y2={py(lineaObjetivo)}
            />
            {etiquetaObjetivo && (
              <text x={dibujoAncho} y={py(lineaObjetivo) - 5} textAnchor="end">
                {etiquetaObjetivo}
              </text>
            )}
          </>
        )}

        {series.map((s) => {
          const segmentos = tramos(s.puntos)
          return (
            <g key={s.nombre}>
              {segmentos.map((seg, i) => (
                <polyline
                  key={i}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={s.discontinua ? '5 4' : undefined}
                  points={seg.map(({ idx, y }) => `${px(idx)},${py(y)}`).join(' ')}
                />
              ))}
              {s.marcadores &&
                s.puntos.map((p, i) =>
                  p.y === null ? null : (
                    <circle key={i} cx={px(i)} cy={py(p.y)} r={2.8} fill={s.color} />
                  ),
                )}
            </g>
          )
        })}

        <line className="eje" x1={0} y1={dibujoAlto} x2={dibujoAncho} y2={dibujoAlto} />

        {etiquetas.map((e, i) =>
          visiblesX.has(i) ? (
            <text key={i} x={px(i)} y={dibujoAlto + 16} textAnchor="middle">
              {e}
            </text>
          ) : null,
        )}
      </g>
    </svg>
  )

  return <div ref={ref}>{svg}</div>
}

/** Parte la serie en tramos continuos, saltando los huecos (y === null). */
function tramos(puntos: PuntoSerie[]): { idx: number; y: number }[][] {
  const salida: { idx: number; y: number }[][] = []
  let actual: { idx: number; y: number }[] = []
  puntos.forEach((p, idx) => {
    if (p.y === null || !Number.isFinite(p.y)) {
      if (actual.length > 0) salida.push(actual)
      actual = []
    } else {
      actual.push({ idx, y: p.y })
    }
  })
  if (actual.length > 0) salida.push(actual)
  return salida.filter((t) => t.length > 0)
}

/** Grafica de barras verticales con linea de objetivo opcional. */
export function GraficaBarras({
  valores,
  etiquetas,
  objetivo,
  alto = 190,
  color = 'var(--acento)',
  colorExceso = 'var(--alerta)',
}: {
  valores: (number | null)[]
  etiquetas: string[]
  objetivo?: number
  alto?: number
  color?: string
  colorExceso?: string
}) {
  const [ref, ancho] = usarAncho<HTMLDivElement>()
  const dibujoAncho = Math.max(60, ancho - M.izquierda - M.derecha)
  const dibujoAlto = alto - M.arriba - M.abajo

  const numeros = valores.filter((v): v is number => v !== null && Number.isFinite(v))
  const max = Math.max(objetivo ?? 0, ...(numeros.length > 0 ? numeros : [1])) * 1.15 || 1
  const n = Math.max(valores.length, 1)
  const anchoRanura = dibujoAncho / n
  const anchoBarra = Math.max(4, Math.min(38, anchoRanura * 0.6))
  const py = (v: number) => dibujoAlto - (v / max) * dibujoAlto

  const marcasY = Array.from({ length: 4 }, (_, i) => (max * (i + 1)) / 4)
  const maxEtiquetas = Math.max(2, Math.floor(dibujoAncho / 44))
  const pasoX = Math.max(1, Math.ceil(n / maxEtiquetas))
  const visiblesX = indicesEtiquetas(n, pasoX)

  const svg = (
    <svg
      className="grafica"
      width={ancho}
      height={alto}
      viewBox={`0 0 ${ancho} ${alto}`}
      role="img"
      aria-label="Calorias por dia"
    >
      <g transform={`translate(${M.izquierda},${M.arriba})`}>
        {marcasY.map((v, i) => (
          <g key={i}>
            <line className="rejilla-linea" x1={0} y1={py(v)} x2={dibujoAncho} y2={py(v)} />
            <text x={-8} y={py(v) + 3} textAnchor="end">
              {Math.round(v)}
            </text>
          </g>
        ))}

        {valores.map((v, i) => {
          if (v === null || v <= 0) return null
          const x = i * anchoRanura + (anchoRanura - anchoBarra) / 2
          const excedido = objetivo !== undefined && v > objetivo
          return (
            <rect
              key={i}
              x={x}
              y={py(v)}
              width={anchoBarra}
              height={Math.max(1, dibujoAlto - py(v))}
              rx={3}
              fill={excedido ? colorExceso : color}
            />
          )
        })}

        {objetivo !== undefined && (
          <line className="objetivo" x1={0} y1={py(objetivo)} x2={dibujoAncho} y2={py(objetivo)} />
        )}

        <line className="eje" x1={0} y1={dibujoAlto} x2={dibujoAncho} y2={dibujoAlto} />

        {etiquetas.map((e, i) =>
          visiblesX.has(i) ? (
            <text key={i} x={i * anchoRanura + anchoRanura / 2} y={dibujoAlto + 16} textAnchor="middle">
              {e}
            </text>
          ) : null,
        )}
      </g>
    </svg>
  )

  return <div ref={ref}>{svg}</div>
}

export function Leyenda({ items }: { items: { nombre: string; color: string }[] }) {
  return (
    <div className="leyenda">
      {items.map((i) => (
        <span key={i.nombre}>
          <span className="punto" style={{ background: i.color }} />
          {i.nombre}
        </span>
      ))}
    </div>
  )
}
