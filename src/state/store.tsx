import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { cargarEstado, guardarEstado, nuevoId, normalizar } from '../lib/almacen'
import type {
  Ajustes,
  Alimento,
  EstadoApp,
  Perfil,
  RegistroComida,
  RegistroPeso,
} from '../lib/types'

type Accion =
  | { tipo: 'perfil/actualizar'; datos: Partial<Perfil> }
  | { tipo: 'ajustes/actualizar'; datos: Partial<Ajustes> }
  | { tipo: 'comida/agregar'; comida: Omit<RegistroComida, 'id'> }
  | { tipo: 'comida/actualizar'; id: string; datos: Partial<RegistroComida> }
  | { tipo: 'comida/eliminar'; id: string }
  | { tipo: 'comida/duplicarDia'; origen: string; destino: string }
  | { tipo: 'peso/guardar'; peso: RegistroPeso }
  | { tipo: 'peso/eliminar'; fecha: string }
  | { tipo: 'alimento/agregar'; alimento: Omit<Alimento, 'id'> }
  | { tipo: 'alimento/actualizar'; id: string; datos: Partial<Alimento> }
  | { tipo: 'alimento/eliminar'; id: string }
  | { tipo: 'estado/reemplazar'; estado: EstadoApp }

function reductor(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.tipo) {
    case 'perfil/actualizar':
      return { ...estado, perfil: { ...estado.perfil, ...accion.datos } }

    case 'ajustes/actualizar':
      return { ...estado, ajustes: { ...estado.ajustes, ...accion.datos } }

    case 'comida/agregar':
      return {
        ...estado,
        comidas: [...estado.comidas, { ...accion.comida, id: nuevoId('c') }],
      }

    case 'comida/actualizar':
      return {
        ...estado,
        comidas: estado.comidas.map((c) =>
          c.id === accion.id ? { ...c, ...accion.datos } : c,
        ),
      }

    case 'comida/eliminar':
      return { ...estado, comidas: estado.comidas.filter((c) => c.id !== accion.id) }

    case 'comida/duplicarDia': {
      const copia = estado.comidas
        .filter((c) => c.fecha === accion.origen)
        .map((c) => ({ ...c, id: nuevoId('c'), fecha: accion.destino }))
      return { ...estado, comidas: [...estado.comidas, ...copia] }
    }

    case 'peso/guardar': {
      const otros = estado.pesos.filter((p) => p.fecha !== accion.peso.fecha)
      return { ...estado, pesos: [...otros, accion.peso].sort((a, b) => a.fecha.localeCompare(b.fecha)) }
    }

    case 'peso/eliminar':
      return { ...estado, pesos: estado.pesos.filter((p) => p.fecha !== accion.fecha) }

    case 'alimento/agregar':
      return {
        ...estado,
        alimentos: [...estado.alimentos, { ...accion.alimento, id: nuevoId('a') }],
      }

    case 'alimento/actualizar':
      return {
        ...estado,
        alimentos: estado.alimentos.map((a) =>
          a.id === accion.id ? { ...a, ...accion.datos } : a,
        ),
      }

    case 'alimento/eliminar':
      return { ...estado, alimentos: estado.alimentos.filter((a) => a.id !== accion.id) }

    case 'estado/reemplazar':
      return normalizar(accion.estado)

    default:
      return estado
  }
}

interface ContextoApp {
  estado: EstadoApp
  despachar: (accion: Accion) => void
  reiniciar: () => void
}

const Contexto = createContext<ContextoApp | null>(null)

export function ProveedorApp({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reductor, undefined, cargarEstado)

  useEffect(() => {
    guardarEstado(estado)
  }, [estado])

  useEffect(() => {
    document.documentElement.dataset.tema = estado.ajustes.tema
  }, [estado.ajustes.tema])

  const reiniciar = useCallback(() => {
    localStorage.removeItem('fit.estado.v1')
    window.location.reload()
  }, [])

  const valor = useMemo(() => ({ estado, despachar, reiniciar }), [estado, reiniciar])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useApp(): ContextoApp {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useApp debe usarse dentro de <ProveedorApp>')
  return ctx
}
