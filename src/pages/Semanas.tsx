import { useMemo, useState } from 'react'
import { Aviso, Metrica, Tarjeta, Vacio } from '../components/Basicos'
import { GraficaBarras, GraficaLineas, Leyenda } from '../components/Graficas'
import { diasDeSemana, formatoCorto, formatoRango } from '../lib/dates'
import { resumenSemanal, totalesPorDia, type ResumenSemana } from '../lib/estadisticas'
import { useApp } from '../state/store'
import type { Objetivo } from '../lib/types'

const DIAS_CORTOS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

export function Semanas() {
  const { estado } = useApp()
  const { comidas, pesos, perfil, ajustes } = estado

  const semanas = useMemo(
    () => resumenSemanal(comidas, pesos, perfil, ajustes.inicioSemana),
    [comidas, pesos, perfil, ajustes.inicioSemana],
  )

  const [seleccion, setSeleccion] = useState<string | null>(null)
  const activa = semanas.find((s) => s.clave === seleccion) ?? semanas[0]

  const cronologicas = useMemo(() => [...semanas].reverse(), [semanas])
  const ultimas = cronologicas.slice(-12)

  if (semanas.length === 0) {
    return (
      <Tarjeta titulo="Semana a semana">
        <Vacio>
          Registra comidas o pesos y aqui apareceran los resumenes semanales, con tu
          cambio de peso, la media de calorias y el balance frente a tu objetivo.
        </Vacio>
      </Tarjeta>
    )
  }

  return (
    <>
      {activa && <ResumenActiva semana={activa} />}

      <Tarjeta titulo="Peso medio por semana" sub="Comparar medias semanales elimina el ruido del dia a dia">
        <GraficaLineas
          etiquetas={ultimas.map((s) => formatoCorto(s.inicio))}
          series={[
            {
              nombre: 'Peso medio',
              color: 'var(--acento)',
              puntos: ultimas.map((s) => ({ x: s.clave, y: s.pesoMedio })),
              marcadores: true,
            },
          ]}
          formatoY={(v) => v.toFixed(1)}
          alto={200}
        />
      </Tarjeta>

      <Tarjeta titulo="Calorias medias por semana" sub="La linea discontinua es tu objetivo diario actual">
        <GraficaBarras
          valores={ultimas.map((s) => s.kcalMedia)}
          etiquetas={ultimas.map((s) => formatoCorto(s.inicio))}
          objetivo={activa?.kcalObjetivo}
        />
        <Leyenda
          items={[
            { nombre: 'Dentro del objetivo', color: 'var(--acento)' },
            { nombre: 'Por encima del objetivo', color: 'var(--alerta)' },
          ]}
        />
      </Tarjeta>

      <Tarjeta titulo="Historial semanal" sub="Toca una fila para ver el detalle">
        <div className="tabla-envoltura">
          <table>
            <thead>
              <tr>
                <th>Semana</th>
                <th>Peso</th>
                <th>Δ</th>
                <th>kcal/dia</th>
                <th>Prot.</th>
                <th>Carb.</th>
                <th>Grasa</th>
                <th>Dias</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((s) => (
                <tr
                  key={s.clave}
                  onClick={() => setSeleccion(s.clave)}
                  style={{
                    cursor: 'pointer',
                    background: s.clave === activa?.clave ? 'var(--acento-suave)' : undefined,
                  }}
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.etiqueta}</div>
                    <div style={{ color: 'var(--texto-3)', fontSize: '0.72rem' }}>
                      {formatoRango(s.inicio, s.fin)}
                    </div>
                  </td>
                  <td>{s.pesoMedio === null ? '—' : `${s.pesoMedio.toFixed(1)} kg`}</td>
                  <td className={claseDelta(s.deltaPeso, perfil.objetivo)}>
                    {s.deltaPeso === null ? '—' : `${s.deltaPeso > 0 ? '+' : ''}${s.deltaPeso.toFixed(2)}`}
                  </td>
                  <td>{s.kcalMedia ?? '—'}</td>
                  <td>{s.macrosMedios ? `${Math.round(s.macrosMedios.proteina)} g` : '—'}</td>
                  <td>{s.macrosMedios ? `${Math.round(s.macrosMedios.carbos)} g` : '—'}</td>
                  <td>{s.macrosMedios ? `${Math.round(s.macrosMedios.grasa)} g` : '—'}</td>
                  <td>{s.diasConComidas}/7</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </>
  )
}

function ResumenActiva({ semana }: { semana: ResumenSemana }) {
  const { estado } = useApp()
  const dias = diasDeSemana(semana.inicio, estado.ajustes.inicioSemana)
  const porDia = useMemo(() => totalesPorDia(estado.comidas), [estado.comidas])

  const real = semana.deltaPeso
  const esperado = semana.cambioEsperadoKg

  return (
    <>
      <Tarjeta titulo={`Semana ${semana.etiqueta}`} sub={formatoRango(semana.inicio, semana.fin)}>
        <div className="rejilla cuatro">
          <Metrica
            titulo="Peso medio"
            valor={semana.pesoMedio === null ? '—' : semana.pesoMedio.toFixed(1)}
            unidad={semana.pesoMedio === null ? '' : 'kg'}
            pie={`${semana.diasConPeso} pesajes`}
            tono="normal"
          />
          <Metrica
            titulo="Cambio real"
            valor={real === null ? '—' : `${real > 0 ? '+' : ''}${real.toFixed(2)}`}
            unidad={real === null ? '' : 'kg'}
            pie="vs semana anterior"
            tono="normal"
          />
          <Metrica
            titulo="kcal medias"
            valor={semana.kcalMedia ?? '—'}
            pie={`objetivo ${semana.kcalObjetivo}`}
            tono="normal"
          />
          <Metrica
            titulo="Balance"
            valor={
              semana.balanceMedio === null
                ? '—'
                : `${semana.balanceMedio > 0 ? '+' : ''}${semana.balanceMedio}`
            }
            unidad={semana.balanceMedio === null ? '' : 'kcal'}
            pie="media diaria vs objetivo"
            tono={tonoBalance(semana.balanceMedio, estado.perfil.objetivo)}
          />
        </div>

        {real !== null && esperado !== null && (
          <div style={{ marginTop: 14 }}>
            <Aviso>
              <span>
                Con {semana.diasConComidas} dias registrados tu balance energetico apuntaba a{' '}
                <strong>
                  {esperado > 0 ? '+' : ''}
                  {esperado.toFixed(2)} kg
                </strong>{' '}
                y la bascula marco{' '}
                <strong>
                  {real > 0 ? '+' : ''}
                  {real.toFixed(2)} kg
                </strong>
                . {interpretacion(real, esperado, semana.diasConComidas)}
              </span>
            </Aviso>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Dia a dia" sub="Calorias registradas frente al objetivo">
        <GraficaBarras
          valores={dias.map((d) => porDia.get(d)?.macros.kcal ?? null)}
          etiquetas={DIAS_CORTOS}
          objetivo={semana.kcalObjetivo}
        />
        <div className="tabla-envoltura" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>kcal</th>
                <th>Prot.</th>
                <th>Carb.</th>
                <th>Grasa</th>
                <th>vs obj.</th>
              </tr>
            </thead>
            <tbody>
              {dias.map((d, i) => {
                const t = porDia.get(d)
                const kcal = t?.macros.kcal ?? null
                const dif = kcal === null ? null : kcal - semana.kcalObjetivo
                return (
                  <tr key={d}>
                    <td>
                      {DIAS_CORTOS[i]} <span style={{ color: 'var(--texto-3)' }}>{formatoCorto(d)}</span>
                    </td>
                    <td>{kcal ?? '—'}</td>
                    <td>{t ? `${Math.round(t.macros.proteina)} g` : '—'}</td>
                    <td>{t ? `${Math.round(t.macros.carbos)} g` : '—'}</td>
                    <td>{t ? `${Math.round(t.macros.grasa)} g` : '—'}</td>
                    <td className={tonoBalance(dif, estado.perfil.objetivo)}>
                      {dif === null ? '—' : `${dif > 0 ? '+' : ''}${dif}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </>
  )
}

/**
 * Un balance por debajo del objetivo ayuda a quien busca perder grasa, pero
 * perjudica a quien busca ganar masa: el tono depende de la meta.
 */
function tonoBalance(
  balance: number | null,
  objetivo: Objetivo,
): 'positivo' | 'negativo' | 'neutro' | 'normal' {
  if (balance === null) return 'normal'
  if (objetivo === 'mantener') return Math.abs(balance) <= 150 ? 'positivo' : 'neutro'
  if (objetivo === 'perder') return balance <= 0 ? 'positivo' : 'negativo'
  return balance >= 0 ? 'positivo' : 'negativo'
}

function claseDelta(delta: number | null, objetivo: string): string {
  if (delta === null) return ''
  if (objetivo === 'mantener') return Math.abs(delta) < 0.3 ? 'positivo' : 'neutro'
  if (objetivo === 'perder') return delta < 0 ? 'positivo' : 'negativo'
  return delta > 0 ? 'positivo' : 'negativo'
}

function interpretacion(real: number, esperado: number, diasRegistrados: number): string {
  if (diasRegistrados < 4) {
    return 'Con menos de 4 dias registrados la estimacion es poco fiable.'
  }
  const diferencia = real - esperado
  if (Math.abs(diferencia) < 0.3) {
    return 'Los numeros cuadran: tu registro y tu gasto estimado son consistentes.'
  }
  if (diferencia > 0) {
    return 'Bajaste menos de lo previsto: puede ser retencion de liquidos, o que falten calorias por registrar.'
  }
  return 'Bajaste mas de lo previsto: es normal al inicio por el glucogeno y el agua asociada.'
}
