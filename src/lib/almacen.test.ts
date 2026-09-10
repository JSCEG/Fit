import { describe, expect, it } from 'vitest'
import {
  estadoInicial,
  exportarComidasCSV,
  exportarPesosCSV,
  normalizar,
  nuevoId,
} from './almacen'
import type { EstadoApp } from './types'

describe('almacen', () => {
  it('arranca con la biblioteca de alimentos poblada', () => {
    const e = estadoInicial()
    expect(e.alimentos.length).toBeGreaterThan(20)
    expect(e.comidas).toEqual([])
    expect(e.pesos).toEqual([])
  })

  it('normaliza datos ausentes o corruptos sin romperse', () => {
    expect(normalizar(null).perfil.edad).toBe(estadoInicial().perfil.edad)
    expect(normalizar('texto').alimentos.length).toBeGreaterThan(0)
    expect(normalizar({ comidas: 'no es lista' }).comidas).toEqual([])
  })

  it('descarta registros invalidos al importar', () => {
    const sucio = {
      pesos: [{ fecha: '2026-09-01', kg: 80, notas: '' }, { fecha: '2026-09-02', kg: 'x' }, null],
      comidas: [{ id: 'a', fecha: '2026-09-01' }, { fecha: 'sin id' }],
    }
    const limpio = normalizar(sucio)
    expect(limpio.pesos).toHaveLength(1)
    expect(limpio.comidas).toHaveLength(1)
  })

  it('conserva el perfil guardado y completa lo que falte', () => {
    const limpio = normalizar({ perfil: { edad: 41 } })
    expect(limpio.perfil.edad).toBe(41)
    expect(limpio.perfil.alturaCm).toBe(estadoInicial().perfil.alturaCm)
  })

  it('genera identificadores unicos', () => {
    const ids = new Set(Array.from({ length: 200 }, () => nuevoId('c')))
    expect(ids.size).toBe(200)
  })

  it('exporta CSV escapando comas y comillas', () => {
    const estado: EstadoApp = {
      ...estadoInicial(),
      comidas: [
        {
          id: 'c1',
          fecha: '2026-09-07',
          momento: 'comida',
          alimentoId: null,
          nombre: 'Arroz, pollo y "salsa"',
          cantidad: 1,
          unidad: 'pieza',
          kcal: 500,
          proteina: 30,
          carbos: 60,
          grasa: 12,
        },
      ],
      pesos: [{ fecha: '2026-09-07', kg: 80.2, notas: 'en ayunas' }],
    }

    const csv = exportarComidasCSV(estado)
    expect(csv.split('\n')[0]).toBe('fecha,momento,alimento,cantidad,unidad,kcal,proteina,carbos,grasa')
    expect(csv).toContain('"Arroz, pollo y ""salsa"""')

    expect(exportarPesosCSV(estado)).toContain('2026-09-07,80.2,en ayunas')
  })
})
