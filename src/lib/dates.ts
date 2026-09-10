/** Utilidades de fecha en horario local, sin dependencias externas. */

const MS_DIA = 86_400_000

/** Fecha local -> "YYYY-MM-DD" (sin desplazamiento por UTC). */
export function aISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

/** "YYYY-MM-DD" -> Date a medianoche local. */
export function desdeISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function hoyISO(): string {
  return aISO(new Date())
}

export function sumarDias(iso: string, dias: number): string {
  const d = desdeISO(iso)
  d.setDate(d.getDate() + dias)
  return aISO(d)
}

export function diffDias(desdeIso: string, hastaIso: string): number {
  const a = desdeISO(desdeIso).getTime()
  const b = desdeISO(hastaIso).getTime()
  return Math.round((b - a) / MS_DIA)
}

/**
 * Primer dia de la semana que contiene `iso`.
 * `inicioSemana`: 1 = lunes (por defecto), 0 = domingo.
 */
export function inicioDeSemana(iso: string, inicioSemana: 0 | 1 = 1): string {
  const d = desdeISO(iso)
  const dow = d.getDay() // 0 = domingo
  const retroceso = (dow - inicioSemana + 7) % 7
  return sumarDias(iso, -retroceso)
}

export function finDeSemana(iso: string, inicioSemana: 0 | 1 = 1): string {
  return sumarDias(inicioDeSemana(iso, inicioSemana), 6)
}

/** Los 7 dias (ISO) de la semana que contiene `iso`. */
export function diasDeSemana(iso: string, inicioSemana: 0 | 1 = 1): string[] {
  const inicio = inicioDeSemana(iso, inicioSemana)
  return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i))
}

/** Numero de semana ISO-8601 y su anio (el anio ISO puede diferir del natural). */
export function semanaISO(iso: string): { anio: number; semana: number } {
  const d = desdeISO(iso)
  // Jueves de la misma semana ISO determina el anio.
  const dow = (d.getDay() + 6) % 7 // 0 = lunes
  d.setDate(d.getDate() - dow + 3)
  const anio = d.getFullYear()
  const primerJueves = new Date(anio, 0, 4)
  const dowPrimero = (primerJueves.getDay() + 6) % 7
  primerJueves.setDate(primerJueves.getDate() - dowPrimero + 3)
  const semana = 1 + Math.round((d.getTime() - primerJueves.getTime()) / (7 * MS_DIA))
  return { anio, semana }
}

/** Etiqueta compacta tipo "2026-S37". */
export function etiquetaSemana(iso: string): string {
  const { anio, semana } = semanaISO(iso)
  return `${anio}-S${String(semana).padStart(2, '0')}`
}

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']

/** "12 sep" */
export function formatoCorto(iso: string): string {
  const d = desdeISO(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

/** "vie 12 sep" */
export function formatoDia(iso: string): string {
  const d = desdeISO(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}

/** "12 sep – 18 sep" */
export function formatoRango(desde: string, hasta: string): string {
  return `${formatoCorto(desde)} – ${formatoCorto(hasta)}`
}

/** Texto relativo amable para la cabecera del diario. */
export function etiquetaRelativa(iso: string): string {
  const delta = diffDias(hoyISO(), iso)
  if (delta === 0) return 'Hoy'
  if (delta === -1) return 'Ayer'
  if (delta === 1) return 'Manana'
  return formatoDia(iso)
}
