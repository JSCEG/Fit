import { useMemo, useState } from 'react'
import { AgregarComida, MOMENTOS } from '../components/AgregarComida'
import { AnilloCalorias, BarrasMacros, Tarjeta, Vacio } from '../components/Basicos'
import {
  diasDeSemana,
  etiquetaRelativa,
  formatoCorto,
  hoyISO,
  sumarDias,
} from '../lib/dates'
import { objetivoDelDia, totalDelDia, totalesPorDia } from '../lib/estadisticas'
import { useApp } from '../state/store'
import type { Momento } from '../lib/types'

const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function Diario() {
  const { estado, despachar } = useApp()
  const [fecha, setFecha] = useState(hoyISO())
  const [abierto, setAbierto] = useState(false)
  const [momentoInicial, setMomentoInicial] = useState<Momento>('desayuno')

  const { comidas, perfil, pesos, ajustes } = estado

  const delDia = useMemo(
    () => comidas.filter((c) => c.fecha === fecha),
    [comidas, fecha],
  )
  const total = useMemo(() => totalDelDia(comidas, fecha), [comidas, fecha])
  const objetivo = useMemo(() => objetivoDelDia(perfil, pesos, fecha), [perfil, pesos, fecha])

  const dias = useMemo(() => diasDeSemana(fecha, ajustes.inicioSemana), [fecha, ajustes.inicioSemana])
  const porDia = useMemo(() => totalesPorDia(comidas), [comidas])

  const ayer = sumarDias(fecha, -1)
  const hayAyer = comidas.some((c) => c.fecha === ayer)

  function abrirCon(m: Momento) {
    setMomentoInicial(m)
    setAbierto(true)
  }

  return (
    <>
      <Tarjeta>
        <div className="selector-dia">
          <button
            className="btn chico fantasma"
            onClick={() => setFecha(sumarDias(fecha, -1))}
            aria-label="Dia anterior"
          >
            ‹
          </button>
          <div className="centro">
            <div className="fuerte">{etiquetaRelativa(fecha)}</div>
            <div className="debil">{formatoCorto(fecha)}</div>
          </div>
          <button
            className="btn chico fantasma"
            onClick={() => setFecha(sumarDias(fecha, 1))}
            aria-label="Dia siguiente"
          >
            ›
          </button>
        </div>

        <div className="tira-semana">
          {dias.map((d, i) => {
            const tiene = (porDia.get(d)?.registros ?? 0) > 0
            return (
              <button
                key={d}
                aria-pressed={d === fecha}
                onClick={() => setFecha(d)}
                title={formatoCorto(d)}
              >
                <span>{DIAS_CORTOS[(i + (ajustes.inicioSemana === 1 ? 0 : 6)) % 7]}</span>
                <span className="num">{Number(d.slice(8))}</span>
                <span className={`punto ${tiene ? '' : 'vacio'}`} />
              </button>
            )
          })}
        </div>

        <div className="acciones" style={{ marginTop: 12 }}>
          <button className="btn chico fantasma" onClick={() => setFecha(hoyISO())}>
            Ir a hoy
          </button>
          <input
            type="date"
            value={fecha}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            style={{ width: 'auto', flex: '0 0 auto' }}
            aria-label="Elegir fecha"
          />
        </div>
      </Tarjeta>

      <Tarjeta>
        <AnilloCalorias consumidas={total.kcal} objetivo={objetivo.kcal} tamano={116} />
        <div className="separador" style={{ margin: '16px 0 14px' }} />
        <BarrasMacros actual={total} objetivo={objetivo} />
      </Tarjeta>

      {abierto ? (
        <AgregarComida
          fecha={fecha}
          momentoInicial={momentoInicial}
          alCerrar={() => setAbierto(false)}
        />
      ) : (
        <div className="acciones">
          <button className="btn principal" onClick={() => abrirCon('desayuno')}>
            + Anadir alimento
          </button>
          {hayAyer && delDia.length === 0 && (
            <button
              className="btn fantasma"
              onClick={() => despachar({ tipo: 'comida/duplicarDia', origen: ayer, destino: fecha })}
            >
              Copiar el dia anterior
            </button>
          )}
        </div>
      )}

      {MOMENTOS.map((m) => {
        const items = delDia.filter((c) => c.momento === m.valor)
        const kcal = Math.round(items.reduce((s, c) => s + c.kcal, 0))
        return (
          <Tarjeta key={m.valor}>
            <div className="grupo-comida">
              <div className="encabezado">
                <h3>{m.etiqueta}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="kcal">{kcal} kcal</span>
                  <button
                    className="btn chico fantasma"
                    onClick={() => abrirCon(m.valor)}
                    aria-label={`Anadir a ${m.etiqueta}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <Vacio>Sin registros</Vacio>
              ) : (
                items.map((c) => (
                  <div className="fila-item" key={c.id}>
                    <div className="info">
                      <div className="nombre">{c.nombre}</div>
                      <div className="detalle">
                        {c.cantidad} {c.unidad} · P {c.proteina} · C {c.carbos} · G {c.grasa}
                      </div>
                    </div>
                    <div className="derecha">
                      <span className="kcal">{Math.round(c.kcal)}</span>
                      <button
                        className="icono-btn"
                        onClick={() => despachar({ tipo: 'comida/eliminar', id: c.id })}
                        aria-label={`Eliminar ${c.nombre}`}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Tarjeta>
        )
      })}
    </>
  )
}
