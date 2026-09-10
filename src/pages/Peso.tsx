import { useMemo, useState } from 'react'
import { Metrica, Tarjeta, Vacio } from '../components/Basicos'
import { GraficaLineas, Leyenda } from '../components/Graficas'
import { formatoCorto, hoyISO } from '../lib/dates'
import { mediaMovil, tendenciaKgPorSemana } from '../lib/estadisticas'
import { useApp } from '../state/store'

const RANGOS = [
  { dias: 30, etiqueta: '30 d' },
  { dias: 90, etiqueta: '90 d' },
  { dias: 365, etiqueta: '1 ano' },
  { dias: 0, etiqueta: 'Todo' },
]

export function Peso() {
  const { estado, despachar } = useApp()
  const { pesos, perfil } = estado

  const [fecha, setFecha] = useState(hoyISO())
  const [kg, setKg] = useState('')
  const [notas, setNotas] = useState('')
  const [rango, setRango] = useState(90)

  const serie = useMemo(() => mediaMovil(pesos, 7), [pesos])

  const visible = useMemo(() => {
    if (rango === 0) return serie
    return serie.slice(Math.max(0, serie.length - rango))
  }, [serie, rango])

  const tendencia = useMemo(() => tendenciaKgPorSemana(pesos), [pesos])

  const primero = serie[0]
  const ultimo = serie[serie.length - 1]
  const cambioTotal = primero && ultimo ? Math.round((ultimo.kg - primero.kg) * 100) / 100 : null
  const minimo = pesos.length > 0 ? Math.min(...pesos.map((p) => p.kg)) : null
  const maximo = pesos.length > 0 ? Math.max(...pesos.map((p) => p.kg)) : null

  function guardar() {
    const valor = Number(kg)
    if (!Number.isFinite(valor) || valor <= 0) return
    despachar({
      tipo: 'peso/guardar',
      peso: { fecha, kg: Math.round(valor * 100) / 100, notas: notas.trim() },
    })
    setKg('')
    setNotas('')
  }

  const historial = useMemo(
    () => [...pesos].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [pesos],
  )

  return (
    <>
      <Tarjeta titulo="Registrar peso" sub="Un valor por dia; si repites fecha se sobrescribe">
        <div className="rejilla dos">
          <div className="campo">
            <label htmlFor="p-fecha">Fecha</label>
            <input id="p-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="p-kg">Peso (kg)</label>
            <input
              id="p-kg"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              placeholder={ultimo ? String(ultimo.kg) : String(perfil.pesoInicialKg)}
            />
          </div>
        </div>
        <div className="campo" style={{ marginTop: 10 }}>
          <label htmlFor="p-notas">Nota (opcional)</label>
          <input
            id="p-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="En ayunas, despues de viajar..."
          />
        </div>
        <button className="btn principal" style={{ marginTop: 12 }} onClick={guardar} disabled={!kg.trim()}>
          Guardar peso
        </button>
      </Tarjeta>

      <div className="rejilla cuatro">
        <Metrica titulo="Actual" valor={ultimo ? ultimo.kg.toFixed(1) : '—'} unidad="kg" tono="normal" />
        <Metrica
          titulo="Cambio total"
          valor={cambioTotal === null ? '—' : `${cambioTotal > 0 ? '+' : ''}${cambioTotal.toFixed(1)}`}
          unidad={cambioTotal === null ? '' : 'kg'}
          pie={primero ? `desde ${formatoCorto(primero.fecha)}` : ''}
          tono="normal"
        />
        <Metrica titulo="Minimo" valor={minimo === null ? '—' : minimo.toFixed(1)} unidad="kg" tono="normal" />
        <Metrica titulo="Maximo" valor={maximo === null ? '—' : maximo.toFixed(1)} unidad="kg" tono="normal" />
      </div>

      <Tarjeta
        titulo="Evolucion"
        sub={tendencia === null ? 'Registra al menos dos pesos' : `Tendencia de las ultimas 4 semanas: ${tendencia > 0 ? '+' : ''}${tendencia.toFixed(2)} kg/semana`}
        accion={
          <div className="acciones">
            {RANGOS.map((r) => (
              <button
                key={r.etiqueta}
                className={`btn chico ${rango === r.dias ? 'principal' : 'fantasma'}`}
                onClick={() => setRango(r.dias)}
              >
                {r.etiqueta}
              </button>
            ))}
          </div>
        }
      >
        {visible.length === 0 ? (
          <Vacio>Aun no hay pesos registrados.</Vacio>
        ) : (
          <>
            <GraficaLineas
              etiquetas={visible.map((p) => formatoCorto(p.fecha))}
              series={[
                {
                  nombre: 'Peso',
                  color: 'var(--texto-3)',
                  puntos: visible.map((p) => ({ x: p.fecha, y: p.kg })),
                  marcadores: visible.length <= 60,
                },
                {
                  nombre: 'Media 7 dias',
                  color: 'var(--acento)',
                  puntos: visible.map((p) => ({ x: p.fecha, y: p.media })),
                },
              ]}
              formatoY={(v) => v.toFixed(1)}
              alto={220}
            />
            <Leyenda
              items={[
                { nombre: 'Peso diario', color: 'var(--texto-3)' },
                { nombre: 'Media movil de 7 dias', color: 'var(--acento)' },
              ]}
            />
          </>
        )}
      </Tarjeta>

      <Tarjeta titulo="Historial" sub={`${pesos.length} registros`}>
        {historial.length === 0 ? (
          <Vacio>Sin registros todavia.</Vacio>
        ) : (
          <div className="tabla-envoltura">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso</th>
                  <th>Nota</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {historial.slice(0, 60).map((p) => (
                  <tr key={p.fecha}>
                    <td>{formatoCorto(p.fecha)}</td>
                    <td>{p.kg.toFixed(1)} kg</td>
                    <td style={{ textAlign: 'left', color: 'var(--texto-3)' }}>{p.notas || '—'}</td>
                    <td>
                      <button
                        className="icono-btn"
                        onClick={() => despachar({ tipo: 'peso/eliminar', fecha: p.fecha })}
                        aria-label={`Eliminar peso de ${p.fecha}`}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </>
  )
}
