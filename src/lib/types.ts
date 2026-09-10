/** Modelo de datos de la aplicacion. Todo se guarda en localStorage. */

export type Sexo = 'hombre' | 'mujer'

export type NivelActividad =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'alto'
  | 'muy_alto'

export type Objetivo = 'perder' | 'mantener' | 'ganar'

export type Momento = 'desayuno' | 'comida' | 'cena' | 'snack'

export type Unidad = 'g' | 'ml' | 'pieza'

export interface Perfil {
  nombre: string
  sexo: Sexo
  edad: number
  alturaCm: number
  nivelActividad: NivelActividad
  objetivo: Objetivo
  /** kg por semana que se quieren perder (negativo) o ganar (positivo). */
  ritmoSemanalKg: number
  /** Gramos de proteina por kg de peso corporal. */
  proteinaGPorKg: number
  /** Gramos de grasa por kg de peso corporal. */
  grasaGPorKg: number
  /** Si se define, sustituye al objetivo calorico calculado. */
  caloriasObjetivoManual: number | null
  /** Peso de referencia si aun no hay registros de peso. */
  pesoInicialKg: number
}

export interface Alimento {
  id: string
  nombre: string
  marca: string
  /** Cantidad base a la que se refieren los macros (p. ej. 100 g). */
  porcionBase: number
  unidad: Unidad
  kcal: number
  proteina: number
  carbos: number
  grasa: number
  favorito: boolean
}

export interface RegistroComida {
  id: string
  /** Fecha local en formato YYYY-MM-DD. */
  fecha: string
  momento: Momento
  alimentoId: string | null
  nombre: string
  cantidad: number
  unidad: Unidad
  /** Macros ya escalados a `cantidad`. */
  kcal: number
  proteina: number
  carbos: number
  grasa: number
}

export interface RegistroPeso {
  /** Fecha local YYYY-MM-DD. Es la clave: un peso por dia. */
  fecha: string
  kg: number
  notas: string
}

export interface Ajustes {
  /** Dia en que arranca la semana. 1 = lunes, 0 = domingo. */
  inicioSemana: 0 | 1
  tema: 'oscuro' | 'claro'
}

export interface EstadoApp {
  version: number
  perfil: Perfil
  ajustes: Ajustes
  alimentos: Alimento[]
  comidas: RegistroComida[]
  pesos: RegistroPeso[]
}

export interface Macros {
  kcal: number
  proteina: number
  carbos: number
  grasa: number
}
