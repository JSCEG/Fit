import { describe, expect, it } from 'vitest'
import {
  diasDeSemana,
  diffDias,
  etiquetaSemana,
  finDeSemana,
  inicioDeSemana,
  semanaISO,
  sumarDias,
} from './dates'

describe('fechas', () => {
  it('suma y resta dias cruzando meses', () => {
    expect(sumarDias('2026-01-31', 1)).toBe('2026-02-01')
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
    expect(sumarDias('2024-03-01', -1)).toBe('2024-02-29') // bisiesto
  })

  it('calcula la diferencia en dias', () => {
    expect(diffDias('2026-09-01', '2026-09-10')).toBe(9)
    expect(diffDias('2026-09-10', '2026-09-01')).toBe(-9)
    expect(diffDias('2026-09-10', '2026-09-10')).toBe(0)
  })

  it('encuentra el lunes de la semana', () => {
    // 2026-09-10 es jueves.
    expect(inicioDeSemana('2026-09-10', 1)).toBe('2026-09-07')
    expect(finDeSemana('2026-09-10', 1)).toBe('2026-09-13')
    // Un lunes es su propio inicio de semana.
    expect(inicioDeSemana('2026-09-07', 1)).toBe('2026-09-07')
    // Un domingo pertenece a la semana que empezo el lunes anterior.
    expect(inicioDeSemana('2026-09-13', 1)).toBe('2026-09-07')
  })

  it('respeta el domingo como inicio de semana', () => {
    expect(inicioDeSemana('2026-09-10', 0)).toBe('2026-09-06')
    expect(inicioDeSemana('2026-09-06', 0)).toBe('2026-09-06')
  })

  it('devuelve los siete dias de la semana en orden', () => {
    const dias = diasDeSemana('2026-09-10', 1)
    expect(dias).toHaveLength(7)
    expect(dias[0]).toBe('2026-09-07')
    expect(dias[6]).toBe('2026-09-13')
  })

  it('numera las semanas segun ISO-8601', () => {
    expect(semanaISO('2026-01-01')).toEqual({ anio: 2026, semana: 1 })
    // 1 de enero de 2027 es viernes: pertenece a la semana 53 de 2026.
    expect(semanaISO('2027-01-01')).toEqual({ anio: 2026, semana: 53 })
    expect(etiquetaSemana('2026-09-10')).toBe('2026-S37')
  })
})
