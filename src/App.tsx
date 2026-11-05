import { useEffect, useState } from 'react'
import { Aviso } from './components/Basicos'
import { hoyISO } from './lib/dates'
import { pesoVigente } from './lib/estadisticas'
import { caloriasObjetivo } from './lib/nutricion'
import { Ajustes } from './pages/Ajustes'
import { Alimentos } from './pages/Alimentos'
import { Diario } from './pages/Diario'
import { Hoy } from './pages/Hoy'
import { Peso } from './pages/Peso'
import { Semanas } from './pages/Semanas'
import { useApp } from './state/store'

const PAGINAS = [
  { id: 'hoy', etiqueta: 'Hoy', icono: '◎' },
  { id: 'diario', etiqueta: 'Diario', icono: '☰' },
  { id: 'peso', etiqueta: 'Peso', icono: '⚖' },
  { id: 'semanas', etiqueta: 'Semanas', icono: '▤' },
  { id: 'alimentos', etiqueta: 'Alimentos', icono: '✚' },
  { id: 'ajustes', etiqueta: 'Ajustes', icono: '⚙' },
] as const

type PaginaId = (typeof PAGINAS)[number]['id']

function paginaDesdeHash(): PaginaId {
  const h = window.location.hash.replace('#/', '').replace('#', '')
  return (PAGINAS.find((p) => p.id === h)?.id ?? 'hoy') as PaginaId
}

export function App() {
  const { estado } = useApp()
  const [pagina, setPagina] = useState<PaginaId>(paginaDesdeHash)

  useEffect(() => {
    const alCambiar = () => setPagina(paginaDesdeHash())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  function irA(id: string) {
    window.location.hash = id
    setPagina(id as PaginaId)
    window.scrollTo({ top: 0 })
  }

  const sinDatos = estado.comidas.length === 0 && estado.pesos.length === 0
  const objetivo = caloriasObjetivo(estado.perfil, pesoVigente(estado.pesos, estado.perfil, hoyISO()))

  return (
    <div className="app">
      <header className="cabecera">
        <div className="marca">
          <h1>Fit</h1>
          <small>{estado.perfil.nombre || 'peso · calorias · macros'}</small>
        </div>
        <span className="etiqueta">{objetivo} kcal/dia</span>
      </header>

      <main className="contenido">
        {sinDatos && pagina !== 'ajustes' && (
          <Aviso>
            <span>
              Empieza por <strong>Ajustes</strong> para poner tu edad, altura y objetivo. Despues
              registra tu peso y tus comidas: en cuanto tengas unos dias, la pestana{' '}
              <strong>Semanas</strong> te mostrara tu progreso real.
            </span>
          </Aviso>
        )}

        {pagina === 'hoy' && <Hoy irA={irA} />}
        {pagina === 'diario' && <Diario />}
        {pagina === 'peso' && <Peso />}
        {pagina === 'semanas' && <Semanas />}
        {pagina === 'alimentos' && <Alimentos />}
        {pagina === 'ajustes' && <Ajustes />}
      </main>

      <nav className="nav" aria-label="Secciones">
        {PAGINAS.map((p) => (
          <button
            key={p.id}
            onClick={() => irA(p.id)}
            aria-current={pagina === p.id ? 'page' : undefined}
          >
            <span className="icono" aria-hidden="true">
              {p.icono}
            </span>
            {p.etiqueta}
          </button>
        ))}
      </nav>
    </div>
  )
}
