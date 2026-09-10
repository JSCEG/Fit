import { alimentosIniciales } from './alimentosBase'
import type { EstadoApp, Perfil } from './types'

export const CLAVE_ALMACEN = 'fit.estado.v1'
export const VERSION_ESTADO = 1

export const PERFIL_POR_DEFECTO: Perfil = {
  nombre: '',
  sexo: 'hombre',
  edad: 30,
  alturaCm: 175,
  nivelActividad: 'moderado',
  objetivo: 'perder',
  ritmoSemanalKg: 0.5,
  proteinaGPorKg: 2,
  grasaGPorKg: 0.9,
  caloriasObjetivoManual: null,
  pesoInicialKg: 80,
}

export function estadoInicial(): EstadoApp {
  return {
    version: VERSION_ESTADO,
    perfil: { ...PERFIL_POR_DEFECTO },
    ajustes: { inicioSemana: 1, tema: 'oscuro' },
    alimentos: alimentosIniciales(),
    comidas: [],
    pesos: [],
  }
}

/** Lee el estado guardado, tolerando datos ausentes o corruptos. */
export function cargarEstado(): EstadoApp {
  if (typeof localStorage === 'undefined') return estadoInicial()
  try {
    const crudo = localStorage.getItem(CLAVE_ALMACEN)
    if (!crudo) return estadoInicial()
    return normalizar(JSON.parse(crudo))
  } catch {
    return estadoInicial()
  }
}

export function guardarEstado(estado: EstadoApp): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(estado))
  } catch {
    // Cuota llena o almacenamiento bloqueado: la sesion sigue funcionando
    // en memoria aunque no se persista.
  }
}

/**
 * Completa campos que falten y descarta registros invalidos.
 * Se usa tanto al cargar como al importar un respaldo.
 */
export function normalizar(datos: unknown): EstadoApp {
  const base = estadoInicial()
  if (!datos || typeof datos !== 'object') return base
  const d = datos as Partial<EstadoApp>

  return {
    version: VERSION_ESTADO,
    perfil: { ...base.perfil, ...(d.perfil ?? {}) },
    ajustes: { ...base.ajustes, ...(d.ajustes ?? {}) },
    alimentos: Array.isArray(d.alimentos) && d.alimentos.length > 0
      ? d.alimentos.filter((a) => a && typeof a.nombre === 'string' && typeof a.id === 'string')
      : base.alimentos,
    comidas: Array.isArray(d.comidas)
      ? d.comidas.filter((c) => c && typeof c.fecha === 'string' && typeof c.id === 'string')
      : [],
    pesos: Array.isArray(d.pesos)
      ? d.pesos.filter((p) => p && typeof p.fecha === 'string' && Number.isFinite(p.kg))
      : [],
  }
}

export function nuevoId(prefijo = 'id'): string {
  const aleatorio =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefijo}-${Date.now().toString(36)}-${aleatorio}`
}

/** Exporta el estado completo como JSON legible. */
export function exportarJSON(estado: EstadoApp): string {
  return JSON.stringify(estado, null, 2)
}

/** Exporta el diario de comidas a CSV. */
export function exportarComidasCSV(estado: EstadoApp): string {
  const cabecera = ['fecha', 'momento', 'alimento', 'cantidad', 'unidad', 'kcal', 'proteina', 'carbos', 'grasa']
  const filas = [...estado.comidas]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((c) => [c.fecha, c.momento, csv(c.nombre), c.cantidad, c.unidad, c.kcal, c.proteina, c.carbos, c.grasa])
  return [cabecera.join(','), ...filas.map((f) => f.join(','))].join('\n')
}

/** Exporta el historial de peso a CSV. */
export function exportarPesosCSV(estado: EstadoApp): string {
  const cabecera = ['fecha', 'kg', 'notas']
  const filas = [...estado.pesos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((p) => [p.fecha, p.kg, csv(p.notas)])
  return [cabecera.join(','), ...filas.map((f) => f.join(','))].join('\n')
}

function csv(texto: string): string {
  const limpio = (texto ?? '').replace(/"/g, '""')
  return /[",\n]/.test(limpio) ? `"${limpio}"` : limpio
}
