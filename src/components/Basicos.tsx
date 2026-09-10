import type { ReactNode } from 'react'
import type { Macros } from '../lib/types'

export function Tarjeta({
  titulo,
  sub,
  accion,
  children,
}: {
  titulo?: string
  sub?: string
  accion?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="tarjeta">
      {(titulo || accion) && (
        <header>
          <div>
            {titulo && <h2>{titulo}</h2>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {accion}
        </header>
      )}
      {children}
    </section>
  )
}

export function Metrica({
  titulo,
  valor,
  unidad,
  pie,
  tono = 'neutro',
}: {
  titulo: string
  valor: string | number
  unidad?: string
  pie?: string
  tono?: 'positivo' | 'negativo' | 'neutro' | 'normal'
}) {
  return (
    <div className="metrica">
      <span className="titulo">{titulo}</span>
      <span className={`valor ${tono === 'normal' ? '' : tono}`}>
        {valor}
        {unidad && <small>{unidad}</small>}
      </span>
      {pie && <span className="pie">{pie}</span>}
    </div>
  )
}

/** Anillo de progreso de calorias. */
export function AnilloCalorias({
  consumidas,
  objetivo,
  tamano = 132,
}: {
  consumidas: number
  objetivo: number
  tamano?: number
}) {
  const grosor = 11
  const radio = (tamano - grosor) / 2
  const circunferencia = 2 * Math.PI * radio
  const ratio = objetivo > 0 ? Math.min(consumidas / objetivo, 1) : 0
  const excedido = objetivo > 0 && consumidas > objetivo
  const restantes = Math.round(objetivo - consumidas)

  return (
    <div className="anillo-bloque">
      <svg
        className="anillo"
        width={tamano}
        height={tamano}
        viewBox={`0 0 ${tamano} ${tamano}`}
        role="img"
        aria-label={`${Math.round(consumidas)} de ${objetivo} kcal`}
      >
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="var(--fondo-3)"
          strokeWidth={grosor}
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke={excedido ? 'var(--alerta)' : 'var(--acento)'}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - ratio)}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          style={{ fill: 'var(--texto)', fontSize: 26, fontWeight: 700 }}
        >
          {Math.round(consumidas)}
        </text>
        <text x="50%" y="62%" textAnchor="middle" style={{ fontSize: 11 }}>
          de {objetivo} kcal
        </text>
      </svg>
      <div className="anillo-texto">
        <span className={`grande ${excedido ? 'negativo' : 'positivo'}`}>
          {excedido ? `+${Math.abs(restantes)}` : restantes}
        </span>
        <span className="chico">
          {excedido ? 'kcal por encima del objetivo' : 'kcal disponibles hoy'}
        </span>
      </div>
    </div>
  )
}

/** Barras de progreso por macro. */
export function BarrasMacros({ actual, objetivo }: { actual: Macros; objetivo: Macros }) {
  const filas = [
    { clave: 'proteina', nombre: 'Proteina', a: actual.proteina, o: objetivo.proteina },
    { clave: 'carbos', nombre: 'Carbohidratos', a: actual.carbos, o: objetivo.carbos },
    { clave: 'grasa', nombre: 'Grasa', a: actual.grasa, o: objetivo.grasa },
  ] as const

  return (
    <div className="macro-lista">
      {filas.map((f) => {
        const pct = f.o > 0 ? Math.min((f.a / f.o) * 100, 100) : 0
        return (
          <div className="macro-fila" key={f.clave}>
            <div className="linea">
              <span className="nombre">{f.nombre}</span>
              <span className="cifras">
                {Math.round(f.a)} / {f.o} g
                {f.o > 0 && ` · ${Math.round((f.a / f.o) * 100)} %`}
              </span>
            </div>
            <div className={`barra ${f.clave}`}>
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="vacio">{children}</div>
}

export function Aviso({ children, tono }: { children: ReactNode; tono?: 'alerta' }) {
  return <div className={`aviso ${tono ?? ''}`}>{children}</div>
}
