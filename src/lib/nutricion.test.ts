import { describe, expect, it } from 'vitest'
import {
  caloriasObjetivo,
  calcularTDEE,
  calcularTMB,
  escalarAlimento,
  kcalDesdeMacros,
  macrosObjetivo,
  repartoInviable,
  repartoPorcentual,
  sumarMacros,
} from './nutricion'
import { PERFIL_POR_DEFECTO } from './almacen'
import type { Alimento, Perfil } from './types'

const base: Perfil = { ...PERFIL_POR_DEFECTO, sexo: 'hombre', edad: 30, alturaCm: 180 }

describe('nutricion', () => {
  it('calcula la TMB con Mifflin-St Jeor', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(calcularTMB(base, 80)).toBeCloseTo(1780, 5)
    // Mujer: mismo calculo con -161 en lugar de +5.
    expect(calcularTMB({ ...base, sexo: 'mujer' }, 80)).toBeCloseTo(1614, 5)
  })

  it('aplica el factor de actividad al TDEE', () => {
    expect(calcularTDEE({ ...base, nivelActividad: 'sedentario' }, 80)).toBeCloseTo(1780 * 1.2, 5)
    expect(calcularTDEE({ ...base, nivelActividad: 'moderado' }, 80)).toBeCloseTo(1780 * 1.55, 5)
  })

  it('resta el deficit correspondiente al ritmo semanal', () => {
    const perfil: Perfil = { ...base, objetivo: 'perder', ritmoSemanalKg: 0.5 }
    const tdee = calcularTDEE(perfil, 80)
    // 0.5 kg/semana = 3850 kcal/semana = 550 kcal/dia.
    expect(caloriasObjetivo(perfil, 80)).toBe(Math.round(tdee - 550))
  })

  it('suma el superavit cuando el objetivo es ganar', () => {
    const perfil: Perfil = { ...base, objetivo: 'ganar', ritmoSemanalKg: 0.25 }
    const tdee = calcularTDEE(perfil, 80)
    expect(caloriasObjetivo(perfil, 80)).toBe(Math.round(tdee + 275))
  })

  it('no propone deficits por debajo del 60 % del gasto', () => {
    const perfil: Perfil = { ...base, objetivo: 'perder', ritmoSemanalKg: 1.5 }
    const tdee = calcularTDEE(perfil, 80)
    expect(caloriasObjetivo(perfil, 80)).toBe(Math.round(tdee * 0.6))
  })

  it('respeta el objetivo calorico manual', () => {
    const perfil: Perfil = { ...base, caloriasObjetivoManual: 2100 }
    expect(caloriasObjetivo(perfil, 80)).toBe(2100)
  })

  it('mantiene el objetivo de mantenimiento igual al gasto', () => {
    const perfil: Perfil = { ...base, objetivo: 'mantener' }
    expect(caloriasObjetivo(perfil, 80)).toBe(Math.round(calcularTDEE(perfil, 80)))
  })

  it('reparte los macros dejando los carbohidratos como resto', () => {
    const perfil: Perfil = {
      ...base,
      caloriasObjetivoManual: 2000,
      proteinaGPorKg: 2,
      grasaGPorKg: 1,
    }
    const m = macrosObjetivo(perfil, 80)
    expect(m.kcal).toBe(2000)
    expect(m.proteina).toBe(160) // 2 g/kg x 80 kg
    expect(m.grasa).toBe(80) // 1 g/kg x 80 kg
    // 2000 - 160*4 - 80*9 = 640 kcal => 160 g de carbohidratos.
    expect(m.carbos).toBe(160)
  })

  it('nunca devuelve carbohidratos negativos', () => {
    const perfil: Perfil = {
      ...base,
      caloriasObjetivoManual: 800,
      proteinaGPorKg: 2,
      grasaGPorKg: 1.5,
    }
    expect(macrosObjetivo(perfil, 80).carbos).toBe(0)
    expect(repartoInviable(perfil, 80)).toBe(true)
  })

  it('escala los macros de un alimento a la cantidad pedida', () => {
    const pollo: Alimento = {
      id: 'x',
      nombre: 'Pollo',
      marca: '',
      porcionBase: 100,
      unidad: 'g',
      kcal: 165,
      proteina: 31,
      carbos: 0,
      grasa: 3.6,
      favorito: false,
    }
    expect(escalarAlimento(pollo, 150)).toEqual({
      kcal: 248,
      proteina: 46.5,
      carbos: 0,
      grasa: 5.4,
    })
    expect(escalarAlimento(pollo, 0).kcal).toBe(0)
  })

  it('deriva las calorias de los macros con 4/4/9', () => {
    expect(kcalDesdeMacros({ proteina: 30, carbos: 40, grasa: 10 })).toBe(370)
  })

  it('suma listas de macros', () => {
    const total = sumarMacros([
      { kcal: 100, proteina: 10, carbos: 5, grasa: 2 },
      { kcal: 250, proteina: 20, carbos: 30, grasa: 8 },
    ])
    expect(total).toEqual({ kcal: 350, proteina: 30, carbos: 35, grasa: 10 })
  })

  it('reparte el porcentaje calorico entre macros', () => {
    // 100 g prot (400) + 100 g carb (400) + 0 g grasa = 50/50.
    expect(repartoPorcentual({ kcal: 800, proteina: 100, carbos: 100, grasa: 0 })).toEqual({
      proteina: 50,
      carbos: 50,
      grasa: 0,
    })
    expect(repartoPorcentual({ kcal: 0, proteina: 0, carbos: 0, grasa: 0 }).proteina).toBe(0)
  })
})
