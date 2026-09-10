import {
  diasDeSemana,
  diffDias,
  finDeSemana,
  inicioDeSemana,
  etiquetaSemana,
} from './dates'
import { KCAL_POR_KG, MACROS_CERO, caloriasObjetivo, macrosObjetivo, sumarMacros } from './nutricion'
import type { Macros, Perfil, RegistroComida, RegistroPeso } from './types'

export interface TotalDia {
  fecha: string
  macros: Macros
  registros: number
}

export interface ResumenSemana {
  clave: string
  etiqueta: string
  inicio: string
  fin: string
  /** Dias de la semana con al menos una comida registrada. */
  diasConComidas: number
  /** Dias de la semana con peso registrado. */
  diasConPeso: number
  /** Media de calorias de los dias registrados (null si no hay ninguno). */
  kcalMedia: number | null
  macrosMedios: Macros | null
  /** Suma de calorias de la semana. */
  kcalTotal: number
  /** Media de peso de la semana (null si no hay registros). */
  pesoMedio: number | null
  /** Cambio de peso medio respecto de la semana anterior. */
  deltaPeso: number | null
  /** Objetivo calorico del periodo, con el peso vigente de la semana. */
  kcalObjetivo: number
  /** Balance energetico medio por dia (real - objetivo). */
  balanceMedio: number | null
  /** Cambio de peso esperado por el balance acumulado de los dias registrados. */
  cambioEsperadoKg: number | null
  /** Porcentaje de dias de la semana con comidas registradas. */
  adherencia: number
}

/** Agrupa las comidas por fecha y suma sus macros. */
export function totalesPorDia(comidas: RegistroComida[]): Map<string, TotalDia> {
  const mapa = new Map<string, TotalDia>()
  for (const c of comidas) {
    const actual = mapa.get(c.fecha) ?? { fecha: c.fecha, macros: { ...MACROS_CERO }, registros: 0 }
    actual.macros = sumarMacros([actual.macros, c])
    actual.registros += 1
    mapa.set(c.fecha, actual)
  }
  for (const t of mapa.values()) {
    t.macros = {
      kcal: Math.round(t.macros.kcal),
      proteina: Math.round(t.macros.proteina * 10) / 10,
      carbos: Math.round(t.macros.carbos * 10) / 10,
      grasa: Math.round(t.macros.grasa * 10) / 10,
    }
  }
  return mapa
}

/** Total de macros de un dia concreto. */
export function totalDelDia(comidas: RegistroComida[], fecha: string): Macros {
  return totalesPorDia(comidas.filter((c) => c.fecha === fecha)).get(fecha)?.macros ?? {
    ...MACROS_CERO,
  }
}

/** Peso mas reciente registrado hasta `hasta` (incluido); si no hay, el peso inicial. */
export function pesoVigente(pesos: RegistroPeso[], perfil: Perfil, hasta?: string): number {
  const candidatos = hasta ? pesos.filter((p) => p.fecha <= hasta) : pesos
  if (candidatos.length === 0) {
    // Sin registros previos, se toma el primero posterior si existe.
    const posterior = [...pesos].sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
    return posterior?.kg ?? perfil.pesoInicialKg
  }
  return candidatos.reduce((a, b) => (a.fecha >= b.fecha ? a : b)).kg
}

/**
 * Media movil del peso. Suaviza el ruido diario (sal, agua, glucogeno)
 * para que la tendencia real sea visible.
 */
export function mediaMovil(
  pesos: RegistroPeso[],
  ventanaDias = 7,
): { fecha: string; kg: number; media: number }[] {
  const ordenados = [...pesos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  return ordenados.map((p, i) => {
    const ventana = ordenados.filter(
      (q, j) => j <= i && diffDias(q.fecha, p.fecha) < ventanaDias,
    )
    const media = ventana.reduce((s, q) => s + q.kg, 0) / ventana.length
    return { fecha: p.fecha, kg: p.kg, media: Math.round(media * 100) / 100 }
  })
}

/**
 * Tendencia por regresion lineal sobre los pesos de los ultimos `dias`.
 * Devuelve el ritmo real en kg/semana; null si no hay datos suficientes.
 */
export function tendenciaKgPorSemana(pesos: RegistroPeso[], dias = 28): number | null {
  if (pesos.length < 2) return null
  const ordenados = [...pesos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const ultimo = ordenados[ordenados.length - 1].fecha
  const muestra = ordenados.filter((p) => diffDias(p.fecha, ultimo) < dias)
  if (muestra.length < 2) return null

  const base = muestra[0].fecha
  const xs = muestra.map((p) => diffDias(base, p.fecha))
  const ys = muestra.map((p) => p.kg)
  const n = xs.length
  const mediaX = xs.reduce((a, b) => a + b, 0) / n
  const mediaY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mediaX) * (ys[i] - mediaY)
    den += (xs[i] - mediaX) ** 2
  }
  if (den === 0) return null
  const pendienteDiaria = num / den
  return Math.round(pendienteDiaria * 7 * 100) / 100
}

/**
 * Construye el resumen de todas las semanas con actividad, de la mas
 * reciente a la mas antigua. Cada semana se compara con la anterior.
 */
export function resumenSemanal(
  comidas: RegistroComida[],
  pesos: RegistroPeso[],
  perfil: Perfil,
  inicioSemana: 0 | 1 = 1,
): ResumenSemana[] {
  const fechas = [...comidas.map((c) => c.fecha), ...pesos.map((p) => p.fecha)]
  if (fechas.length === 0) return []

  const inicios = new Set(fechas.map((f) => inicioDeSemana(f, inicioSemana)))
  const ordenados = [...inicios].sort()

  // Se rellenan las semanas intermedias sin datos para no romper la serie.
  const primera = ordenados[0]
  const ultima = ordenados[ordenados.length - 1]
  const todas: string[] = []
  for (let f = primera; f <= ultima; f = sumarSemana(f)) todas.push(f)

  const porDia = totalesPorDia(comidas)
  const resumenes: ResumenSemana[] = []
  let pesoMedioAnterior: number | null = null

  for (const inicio of todas) {
    const fin = finDeSemana(inicio, inicioSemana)
    const dias = diasDeSemana(inicio, inicioSemana)

    const totales = dias
      .map((d) => porDia.get(d))
      .filter((t): t is TotalDia => Boolean(t) && t!.registros > 0)

    const pesosSemana = pesos.filter((p) => p.fecha >= inicio && p.fecha <= fin)
    const pesoMedio =
      pesosSemana.length > 0
        ? Math.round((pesosSemana.reduce((s, p) => s + p.kg, 0) / pesosSemana.length) * 100) / 100
        : null

    const kcalTotal = totales.reduce((s, t) => s + t.macros.kcal, 0)
    const kcalMedia = totales.length > 0 ? Math.round(kcalTotal / totales.length) : null
    const macrosMedios =
      totales.length > 0
        ? {
            kcal: kcalMedia!,
            proteina: media(totales.map((t) => t.macros.proteina)),
            carbos: media(totales.map((t) => t.macros.carbos)),
            grasa: media(totales.map((t) => t.macros.grasa)),
          }
        : null

    const pesoRef = pesoMedio ?? pesoVigente(pesos, perfil, fin)
    const kcalObjetivo = caloriasObjetivo(perfil, pesoRef)
    const balanceMedio = kcalMedia !== null ? kcalMedia - kcalObjetivo : null

    // Cambio esperado a partir del balance frente al gasto estimado, no
    // frente al objetivo: asi refleja el deficit o superavit real.
    const gasto = caloriasObjetivoNeutro(perfil, pesoRef)
    const cambioEsperadoKg =
      kcalMedia !== null
        ? Math.round((((kcalMedia - gasto) * totales.length) / KCAL_POR_KG) * 100) / 100
        : null

    const deltaPeso =
      pesoMedio !== null && pesoMedioAnterior !== null
        ? Math.round((pesoMedio - pesoMedioAnterior) * 100) / 100
        : null

    resumenes.push({
      clave: inicio,
      etiqueta: etiquetaSemana(inicio),
      inicio,
      fin,
      diasConComidas: totales.length,
      diasConPeso: pesosSemana.length,
      kcalMedia,
      macrosMedios,
      kcalTotal,
      pesoMedio,
      deltaPeso,
      kcalObjetivo,
      balanceMedio,
      cambioEsperadoKg,
      adherencia: Math.round((totales.length / 7) * 100),
    })

    if (pesoMedio !== null) pesoMedioAnterior = pesoMedio
  }

  return resumenes.reverse()
}

/** Gasto diario estimado sin ajuste de objetivo (para calcular el balance real). */
function caloriasObjetivoNeutro(perfil: Perfil, pesoKg: number): number {
  const neutro: Perfil = { ...perfil, objetivo: 'mantener', caloriasObjetivoManual: null }
  return caloriasObjetivo(neutro, pesoKg)
}

function sumarSemana(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const fecha = new Date(y, m - 1, d + 7)
  const yy = fecha.getFullYear()
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function media(nums: number[]): number {
  if (nums.length === 0) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

/** Objetivo de macros del dia usando el peso vigente en esa fecha. */
export function objetivoDelDia(
  perfil: Perfil,
  pesos: RegistroPeso[],
  fecha: string,
): Macros {
  return macrosObjetivo(perfil, pesoVigente(pesos, perfil, fecha))
}

/** Racha de dias consecutivos con registro terminando en `hasta`. */
export function racha(comidas: RegistroComida[], hasta: string): number {
  const conDatos = new Set(comidas.map((c) => c.fecha))
  let dias = 0
  let cursor = hasta
  // Si hoy aun no se registro nada, la racha se mide hasta ayer.
  if (!conDatos.has(cursor)) {
    const [y, m, d] = cursor.split('-').map(Number)
    const f = new Date(y, m - 1, d - 1)
    cursor = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
  }
  while (conDatos.has(cursor)) {
    dias += 1
    const [y, m, d] = cursor.split('-').map(Number)
    const f = new Date(y, m - 1, d - 1)
    cursor = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
  }
  return dias
}
