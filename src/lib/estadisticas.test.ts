import { describe, expect, it } from 'vitest'
import { PERFIL_POR_DEFECTO } from './almacen'
import {
  mediaMovil,
  pesoVigente,
  racha,
  resumenSemanal,
  tendenciaKgPorSemana,
  totalDelDia,
  totalesPorDia,
} from './estadisticas'
import type { Perfil, RegistroComida, RegistroPeso } from './types'

const perfil: Perfil = {
  ...PERFIL_POR_DEFECTO,
  sexo: 'hombre',
  edad: 30,
  alturaCm: 180,
  objetivo: 'perder',
  ritmoSemanalKg: 0.5,
  pesoInicialKg: 80,
}

function comida(
  fecha: string,
  kcal: number,
  extra: Partial<RegistroComida> = {},
): RegistroComida {
  return {
    id: `${fecha}-${kcal}-${Math.random()}`,
    fecha,
    momento: 'comida',
    alimentoId: null,
    nombre: 'test',
    cantidad: 1,
    unidad: 'pieza',
    kcal,
    proteina: 10,
    carbos: 20,
    grasa: 5,
    ...extra,
  }
}

function peso(fecha: string, kg: number): RegistroPeso {
  return { fecha, kg, notas: '' }
}

describe('totales diarios', () => {
  it('agrupa las comidas por fecha', () => {
    const mapa = totalesPorDia([
      comida('2026-09-07', 500),
      comida('2026-09-07', 300),
      comida('2026-09-08', 700),
    ])
    expect(mapa.get('2026-09-07')?.macros.kcal).toBe(800)
    expect(mapa.get('2026-09-07')?.registros).toBe(2)
    expect(mapa.get('2026-09-08')?.macros.kcal).toBe(700)
  })

  it('devuelve ceros para un dia sin registros', () => {
    expect(totalDelDia([comida('2026-09-07', 500)], '2026-09-09')).toEqual({
      kcal: 0,
      proteina: 0,
      carbos: 0,
      grasa: 0,
    })
  })
})

describe('peso vigente', () => {
  it('toma el registro mas reciente hasta la fecha dada', () => {
    const pesos = [peso('2026-09-01', 80), peso('2026-09-05', 79.2), peso('2026-09-09', 78.8)]
    expect(pesoVigente(pesos, perfil, '2026-09-06')).toBe(79.2)
    expect(pesoVigente(pesos, perfil, '2026-09-30')).toBe(78.8)
  })

  it('cae en el peso inicial si no hay registros', () => {
    expect(pesoVigente([], perfil, '2026-09-06')).toBe(80)
  })

  it('usa el primer registro posterior si la fecha es anterior a todos', () => {
    expect(pesoVigente([peso('2026-09-10', 77)], perfil, '2026-09-01')).toBe(77)
  })
})

describe('media movil y tendencia', () => {
  it('promedia la ventana de siete dias', () => {
    const pesos = [peso('2026-09-01', 80), peso('2026-09-02', 82)]
    const serie = mediaMovil(pesos, 7)
    expect(serie[0].media).toBe(80)
    expect(serie[1].media).toBe(81)
  })

  it('no mezcla registros separados por mas dias que la ventana', () => {
    const pesos = [peso('2026-09-01', 80), peso('2026-09-20', 70)]
    const serie = mediaMovil(pesos, 7)
    expect(serie[1].media).toBe(70)
  })

  it('estima el ritmo semanal por regresion lineal', () => {
    // Baja 0.1 kg al dia => 0.7 kg por semana.
    const pesos = Array.from({ length: 8 }, (_, i) =>
      peso(`2026-09-0${i + 1}`, 80 - i * 0.1),
    )
    expect(tendenciaKgPorSemana(pesos)).toBeCloseTo(-0.7, 2)
  })

  it('devuelve null sin datos suficientes', () => {
    expect(tendenciaKgPorSemana([])).toBeNull()
    expect(tendenciaKgPorSemana([peso('2026-09-01', 80)])).toBeNull()
  })
})

describe('resumen semanal', () => {
  it('devuelve una lista vacia sin registros', () => {
    expect(resumenSemanal([], [], perfil, 1)).toEqual([])
  })

  it('agrupa por semana y promedia solo los dias registrados', () => {
    // Semana del lunes 2026-09-07 al domingo 2026-09-13.
    const comidas = [
      comida('2026-09-07', 2000),
      comida('2026-09-08', 1800),
      comida('2026-09-09', 2200),
    ]
    const pesos = [peso('2026-09-07', 80), peso('2026-09-10', 79.6)]
    const [semana] = resumenSemanal(comidas, pesos, perfil, 1)

    expect(semana.inicio).toBe('2026-09-07')
    expect(semana.fin).toBe('2026-09-13')
    expect(semana.diasConComidas).toBe(3)
    expect(semana.diasConPeso).toBe(2)
    expect(semana.kcalTotal).toBe(6000)
    expect(semana.kcalMedia).toBe(2000)
    expect(semana.pesoMedio).toBe(79.8)
    expect(semana.adherencia).toBe(43) // 3 de 7 dias
  })

  it('ordena de la semana mas reciente a la mas antigua y calcula el delta', () => {
    const comidas = [comida('2026-09-01', 2000), comida('2026-09-08', 2000)]
    const pesos = [peso('2026-09-01', 80), peso('2026-09-08', 79)]
    const semanas = resumenSemanal(comidas, pesos, perfil, 1)

    expect(semanas).toHaveLength(2)
    expect(semanas[0].inicio).toBe('2026-09-07')
    expect(semanas[1].inicio).toBe('2026-08-31')
    // La mas reciente baja 1 kg respecto de la anterior.
    expect(semanas[0].deltaPeso).toBe(-1)
    // La primera semana no tiene con que compararse.
    expect(semanas[1].deltaPeso).toBeNull()
  })

  it('rellena las semanas intermedias sin actividad', () => {
    const comidas = [comida('2026-09-01', 2000), comida('2026-09-22', 2000)]
    const semanas = resumenSemanal(comidas, [], perfil, 1)
    expect(semanas).toHaveLength(4)
    expect(semanas[1].kcalMedia).toBeNull()
    expect(semanas[1].diasConComidas).toBe(0)
  })

  it('calcula el balance frente al objetivo y el cambio esperado', () => {
    const perfilManual: Perfil = { ...perfil, caloriasObjetivoManual: 2000 }
    const comidas = [comida('2026-09-07', 2500), comida('2026-09-08', 2500)]
    const [semana] = resumenSemanal(comidas, [peso('2026-09-07', 80)], perfilManual, 1)

    expect(semana.kcalObjetivo).toBe(2000)
    expect(semana.kcalMedia).toBe(2500)
    expect(semana.balanceMedio).toBe(500)
    // El cambio esperado se mide contra el gasto real, no contra el objetivo.
    expect(semana.cambioEsperadoKg).not.toBeNull()
  })

  it('respeta el domingo como inicio de semana', () => {
    const [semana] = resumenSemanal([comida('2026-09-10', 2000)], [], perfil, 0)
    expect(semana.inicio).toBe('2026-09-06')
    expect(semana.fin).toBe('2026-09-12')
  })
})

describe('racha', () => {
  it('cuenta dias consecutivos hacia atras', () => {
    const comidas = [comida('2026-09-08', 100), comida('2026-09-09', 100), comida('2026-09-10', 100)]
    expect(racha(comidas, '2026-09-10')).toBe(3)
  })

  it('sigue contando hasta ayer si hoy aun no hay registro', () => {
    const comidas = [comida('2026-09-08', 100), comida('2026-09-09', 100)]
    expect(racha(comidas, '2026-09-10')).toBe(2)
  })

  it('se corta con un hueco', () => {
    const comidas = [comida('2026-09-06', 100), comida('2026-09-09', 100), comida('2026-09-10', 100)]
    expect(racha(comidas, '2026-09-10')).toBe(2)
  })

  it('es cero sin registros', () => {
    expect(racha([], '2026-09-10')).toBe(0)
  })
})
