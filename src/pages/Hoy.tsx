import { useMemo, useState } from 'react'
import { AnilloCalorias, BarrasMacros, Metrica, Tarjeta, Aviso } from '../components/Basicos'
import { GraficaBarras } from '../components/Graficas'
import { diasDeSemana, etiquetaRelativa, formatoCorto, hoyISO } from '../lib/dates'
import {
  objetivoDelDia,
  pesoVigente,
  racha,
  resumenSemanal,
  tendenciaKgPorSemana,
  totalDelDia,
  totalesPorDia,
} from '../lib/estadisticas'
import { repartoInviable, repartoPorcentual } from '../lib/nutricion'
import { useApp } from '../state/store'

export function Hoy({ irA }: { irA: (pagina: string) => void }) {
  const { estado, despachar } = useApp()
  const hoy = hoyISO()
  const { perfil, comidas, pesos, ajustes } = estado

  const total = useMemo(() => totalDelDia(comidas, hoy), [comidas, hoy])
  const objetivo = useMemo(() => objetivoDelDia(perfil, pesos, hoy), [perfil, pesos, hoy])
  const peso = useMemo(() => pesoVigente(pesos, perfil, hoy), [pesos, perfil, hoy])
  const pesoDeHoy = pesos.find((p) => p.fecha === hoy)
  const tendencia = useMemo(() => tendenciaKgPorSemana(pesos), [pesos])
  const diasRacha = useMemo(() => racha(comidas, hoy), [comidas, hoy])

  const semanas = useMemo(
    () => resumenSemanal(comidas, pesos, perfil, ajustes.inicioSemana),
    [comidas, pesos, perfil, ajustes.inicioSemana],
  )
  const semanaActual = semanas[0]

  const dias = useMemo(() => diasDeSemana(hoy, ajustes.inicioSemana), [hoy, ajustes.inicioSemana])
  const porDia = useMemo(() => totalesPorDia(comidas), [comidas])
  const kcalSemana = dias.map((d) => porDia.get(d)?.macros.kcal ?? null)

  const [pesoTexto, setPesoTexto] = useState(pesoDeHoy ? String(pesoDeHoy.kg) : '')

  const reparto = repartoPorcentual(total)
  const inviable = repartoInviable(perfil, peso)

  function guardarPeso() {
    const kg = Number(pesoTexto)
    if (!Number.isFinite(kg) || kg <= 0) return
    despachar({ tipo: 'peso/guardar', peso: { fecha: hoy, kg: Math.round(kg * 100) / 100, notas: '' } })
  }

  const objetivoRitmo = perfil.objetivo === 'mantener' ? 0 : perfil.objetivo === 'perder' ? -Math.abs(perfil.ritmoSemanalKg) : Math.abs(perfil.ritmoSemanalKg)

  return (
    <>
      {inviable && (
        <Aviso tono="alerta">
          Tus gramos de proteina y grasa por kg ya superan el objetivo calorico: los
          carbohidratos quedarian en cero. Ajustalo en <strong>Ajustes</strong>.
        </Aviso>
      )}

      <Tarjeta titulo={etiquetaRelativa(hoy)} sub={formatoCorto(hoy)}>
        <AnilloCalorias consumidas={total.kcal} objetivo={objetivo.kcal} />
        <div className="separador" style={{ margin: '16px 0 14px' }} />
        <BarrasMacros actual={total} objetivo={objetivo} />
        {total.kcal > 0 && (
          <p style={{ marginTop: 12, color: 'var(--texto-3)', fontSize: '0.78rem' }}>
            Reparto de hoy: {`${reparto.proteina}\u00a0% proteina`} · {`${reparto.carbos}\u00a0% carbohidratos`} ·{' '}
            {`${reparto.grasa}\u00a0% grasa`}
          </p>
        )}
        <div className="acciones" style={{ marginTop: 14 }}>
          <button className="btn principal" onClick={() => irA('diario')}>
            + Registrar comida
          </button>
          <button className="btn fantasma" onClick={() => irA('semanas')}>
            Ver semanas
          </button>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Peso de hoy" sub={pesoDeHoy ? 'Ya registrado, puedes corregirlo' : 'Pesate en ayunas para mayor consistencia'}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div className="campo" style={{ flex: 1 }}>
            <label htmlFor="peso-hoy">Peso (kg)</label>
            <input
              id="peso-hoy"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={pesoTexto}
              onChange={(e) => setPesoTexto(e.target.value)}
              placeholder={String(peso)}
            />
          </div>
          <button className="btn principal" onClick={guardarPeso} disabled={!pesoTexto.trim()}>
            Guardar
          </button>
        </div>
      </Tarjeta>

      <div className="rejilla cuatro">
        <Metrica
          titulo="Peso actual"
          valor={peso.toFixed(1)}
          unidad="kg"
          pie={pesoDeHoy ? 'registrado hoy' : 'ultimo registro'}
          tono="normal"
        />
        <Metrica
          titulo="Tendencia"
          valor={tendencia === null ? '—' : `${tendencia > 0 ? '+' : ''}${tendencia.toFixed(2)}`}
          unidad={tendencia === null ? '' : 'kg/sem'}
          pie={tendencia === null ? 'faltan datos' : `objetivo ${objetivoRitmo > 0 ? '+' : ''}${objetivoRitmo.toFixed(1)}`}
          tono={tonoTendencia(tendencia, objetivoRitmo)}
        />
        <Metrica
          titulo="Racha"
          valor={diasRacha}
          unidad={diasRacha === 1 ? 'dia' : 'dias'}
          pie="registrando comidas"
          tono="normal"
        />
        <Metrica
          titulo="Adherencia"
          valor={semanaActual ? `${semanaActual.adherencia}` : '0'}
          unidad="%"
          pie={semanaActual ? `${semanaActual.diasConComidas}/7 dias esta semana` : 'sin datos'}
          tono="normal"
        />
      </div>

      <Tarjeta titulo="Calorias de la semana" sub="La linea marca tu objetivo diario">
        <GraficaBarras
          valores={kcalSemana}
          etiquetas={dias.map((d) => formatoCorto(d).split(' ')[0])}
          objetivo={objetivo.kcal}
        />
        {semanaActual?.kcalMedia !== null && semanaActual && (
          <p style={{ marginTop: 8, color: 'var(--texto-2)', fontSize: '0.8rem' }}>
            Media de {semanaActual.kcalMedia} kcal en {semanaActual.diasConComidas} dias
            registrados ({signo(semanaActual.balanceMedio)} frente al objetivo).
          </p>
        )}
      </Tarjeta>
    </>
  )
}

function tonoTendencia(
  tendencia: number | null,
  objetivo: number,
): 'positivo' | 'negativo' | 'neutro' | 'normal' {
  if (tendencia === null) return 'normal'
  if (objetivo === 0) return Math.abs(tendencia) < 0.25 ? 'positivo' : 'neutro'
  // Va bien si avanza en la direccion buscada.
  return Math.sign(tendencia) === Math.sign(objetivo) ? 'positivo' : 'negativo'
}

function signo(n: number | null): string {
  if (n === null) return '—'
  return `${n > 0 ? '+' : ''}${n} kcal`
}
