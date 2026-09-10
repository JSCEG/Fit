import type { Alimento, Macros, NivelActividad, Perfil } from './types'

/** kcal aproximadas por kg de peso corporal ganado o perdido. */
export const KCAL_POR_KG = 7700

export const FACTOR_ACTIVIDAD: Record<NivelActividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muy_alto: 1.9,
}

export const ETIQUETA_ACTIVIDAD: Record<NivelActividad, string> = {
  sedentario: 'Sedentario (poco o nada de ejercicio)',
  ligero: 'Ligero (1-3 dias/semana)',
  moderado: 'Moderado (3-5 dias/semana)',
  alto: 'Alto (6-7 dias/semana)',
  muy_alto: 'Muy alto (trabajo fisico o doble sesion)',
}

/** Metabolismo basal, formula de Mifflin-St Jeor. */
export function calcularTMB(perfil: Perfil, pesoKg: number): number {
  const base = 10 * pesoKg + 6.25 * perfil.alturaCm - 5 * perfil.edad
  return perfil.sexo === 'hombre' ? base + 5 : base - 161
}

/** Gasto energetico diario total = TMB x factor de actividad. */
export function calcularTDEE(perfil: Perfil, pesoKg: number): number {
  return calcularTMB(perfil, pesoKg) * FACTOR_ACTIVIDAD[perfil.nivelActividad]
}

/**
 * Ajuste diario derivado del ritmo semanal deseado.
 * -0.5 kg/semana => -550 kcal/dia aprox.
 */
export function ajusteDiario(perfil: Perfil): number {
  if (perfil.objetivo === 'mantener') return 0
  const signo = perfil.objetivo === 'perder' ? -1 : 1
  const ritmo = Math.abs(perfil.ritmoSemanalKg)
  return (signo * ritmo * KCAL_POR_KG) / 7
}

/**
 * Objetivo calorico diario. Se respeta el valor manual si existe.
 * Se aplica un suelo de seguridad del 60 % del TDEE para no proponer
 * deficits extremos.
 */
export function caloriasObjetivo(perfil: Perfil, pesoKg: number): number {
  if (perfil.caloriasObjetivoManual && perfil.caloriasObjetivoManual > 0) {
    return Math.round(perfil.caloriasObjetivoManual)
  }
  const tdee = calcularTDEE(perfil, pesoKg)
  const bruto = tdee + ajusteDiario(perfil)
  const suelo = tdee * 0.6
  return Math.round(Math.max(bruto, suelo))
}

/**
 * Reparto de macros: proteina y grasa se fijan por kg de peso,
 * y los carbohidratos absorben las calorias restantes.
 */
export function macrosObjetivo(perfil: Perfil, pesoKg: number): Macros {
  const kcal = caloriasObjetivo(perfil, pesoKg)
  const proteina = Math.round(perfil.proteinaGPorKg * pesoKg)
  const grasa = Math.round(perfil.grasaGPorKg * pesoKg)
  const kcalRestantes = kcal - proteina * 4 - grasa * 9
  const carbos = Math.max(0, Math.round(kcalRestantes / 4))
  return { kcal, proteina, carbos, grasa }
}

/**
 * Avisa si proteina + grasa ya se comen todas las calorias del objetivo,
 * lo que dejaria los carbohidratos en cero.
 */
export function repartoInviable(perfil: Perfil, pesoKg: number): boolean {
  const kcal = caloriasObjetivo(perfil, pesoKg)
  return perfil.proteinaGPorKg * pesoKg * 4 + perfil.grasaGPorKg * pesoKg * 9 > kcal
}

/** Escala los macros de un alimento a la cantidad indicada. */
export function escalarAlimento(alimento: Alimento, cantidad: number): Macros {
  const factor = alimento.porcionBase > 0 ? cantidad / alimento.porcionBase : 0
  return {
    kcal: redondear(alimento.kcal * factor),
    proteina: redondear(alimento.proteina * factor, 1),
    carbos: redondear(alimento.carbos * factor, 1),
    grasa: redondear(alimento.grasa * factor, 1),
  }
}

/** kcal calculadas a partir de los macros (4/4/9). Util para validar altas. */
export function kcalDesdeMacros(m: Omit<Macros, 'kcal'>): number {
  return Math.round(m.proteina * 4 + m.carbos * 4 + m.grasa * 9)
}

export function sumarMacros(lista: Macros[]): Macros {
  return lista.reduce<Macros>(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteina: acc.proteina + m.proteina,
      carbos: acc.carbos + m.carbos,
      grasa: acc.grasa + m.grasa,
    }),
    { kcal: 0, proteina: 0, carbos: 0, grasa: 0 },
  )
}

export const MACROS_CERO: Macros = { kcal: 0, proteina: 0, carbos: 0, grasa: 0 }

/** Porcentaje de calorias aportado por cada macro. */
export function repartoPorcentual(m: Macros): { proteina: number; carbos: number; grasa: number } {
  const total = m.proteina * 4 + m.carbos * 4 + m.grasa * 9
  if (total <= 0) return { proteina: 0, carbos: 0, grasa: 0 }
  return {
    proteina: Math.round(((m.proteina * 4) / total) * 100),
    carbos: Math.round(((m.carbos * 4) / total) * 100),
    grasa: Math.round(((m.grasa * 9) / total) * 100),
  }
}

export function redondear(n: number, decimales = 0): number {
  const f = 10 ** decimales
  return Math.round(n * f) / f
}
