import { useMemo, useState } from 'react'
import { escalarAlimento, kcalDesdeMacros } from '../lib/nutricion'
import { useApp } from '../state/store'
import { clave } from '../lib/texto'
import type { Alimento, Momento, Unidad } from '../lib/types'

const MOMENTOS: { valor: Momento; etiqueta: string }[] = [
  { valor: 'desayuno', etiqueta: 'Desayuno' },
  { valor: 'comida', etiqueta: 'Comida' },
  { valor: 'cena', etiqueta: 'Cena' },
  { valor: 'snack', etiqueta: 'Snack' },
]

export function AgregarComida({
  fecha,
  momentoInicial,
  alCerrar,
}: {
  fecha: string
  momentoInicial: Momento
  alCerrar: () => void
}) {
  const { estado, despachar } = useApp()
  const [modo, setModo] = useState<'biblioteca' | 'rapida'>('biblioteca')
  const [momento, setMomento] = useState<Momento>(momentoInicial)
  const [busqueda, setBusqueda] = useState('')
  const [elegido, setElegido] = useState<Alimento | null>(null)
  const [cantidad, setCantidad] = useState<string>('')

  // Entrada rapida
  const [rNombre, setRNombre] = useState('')
  const [rKcal, setRKcal] = useState('')
  const [rProt, setRProt] = useState('')
  const [rCarb, setRCarb] = useState('')
  const [rGrasa, setRGrasa] = useState('')
  const [guardarEnBiblioteca, setGuardarEnBiblioteca] = useState(false)

  const resultados = useMemo(() => {
    const q = clave(busqueda.trim())
    const lista = [...estado.alimentos].sort((a, b) => {
      if (a.favorito !== b.favorito) return a.favorito ? -1 : 1
      return a.nombre.localeCompare(b.nombre)
    })
    if (!q) return lista.slice(0, 12)
    return lista
      .filter((a) => clave(`${a.nombre} ${a.marca}`).includes(q))
      .slice(0, 25)
  }, [estado.alimentos, busqueda])

  const previsualizacion = useMemo(() => {
    if (!elegido) return null
    const c = Number(cantidad)
    if (!Number.isFinite(c) || c <= 0) return null
    return escalarAlimento(elegido, c)
  }, [elegido, cantidad])

  function elegir(a: Alimento) {
    setElegido(a)
    setCantidad(String(a.porcionBase))
  }

  function agregarDeBiblioteca() {
    if (!elegido || !previsualizacion) return
    despachar({
      tipo: 'comida/agregar',
      comida: {
        fecha,
        momento,
        alimentoId: elegido.id,
        nombre: elegido.nombre,
        cantidad: Number(cantidad),
        unidad: elegido.unidad,
        ...previsualizacion,
      },
    })
    setElegido(null)
    setCantidad('')
    setBusqueda('')
  }

  function agregarRapida() {
    const proteina = num(rProt)
    const carbos = num(rCarb)
    const grasa = num(rGrasa)
    // Si no se escriben calorias, se derivan de los macros (4/4/9).
    const kcal = rKcal.trim() ? num(rKcal) : kcalDesdeMacros({ proteina, carbos, grasa })
    if (!rNombre.trim() || kcal <= 0) return

    despachar({
      tipo: 'comida/agregar',
      comida: {
        fecha,
        momento,
        alimentoId: null,
        nombre: rNombre.trim(),
        cantidad: 1,
        unidad: 'pieza' as Unidad,
        kcal,
        proteina,
        carbos,
        grasa,
      },
    })

    if (guardarEnBiblioteca) {
      despachar({
        tipo: 'alimento/agregar',
        alimento: {
          nombre: rNombre.trim(),
          marca: 'racion',
          porcionBase: 1,
          unidad: 'pieza',
          kcal,
          proteina,
          carbos,
          grasa,
          favorito: false,
        },
      })
    }

    setRNombre('')
    setRKcal('')
    setRProt('')
    setRCarb('')
    setRGrasa('')
  }

  return (
    <div className="tarjeta" style={{ background: 'var(--fondo-3)' }}>
      <header>
        <h3>Anadir a {fecha}</h3>
        <button className="btn chico fantasma" onClick={alCerrar}>
          Cerrar
        </button>
      </header>

      <div className="campo" style={{ marginBottom: 12 }}>
        <label htmlFor="momento">Momento del dia</label>
        <select
          id="momento"
          value={momento}
          onChange={(e) => setMomento(e.target.value as Momento)}
        >
          {MOMENTOS.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div className="acciones" style={{ marginBottom: 12 }}>
        <button
          className={`btn chico ${modo === 'biblioteca' ? 'principal' : 'fantasma'}`}
          onClick={() => setModo('biblioteca')}
        >
          Desde biblioteca
        </button>
        <button
          className={`btn chico ${modo === 'rapida' ? 'principal' : 'fantasma'}`}
          onClick={() => setModo('rapida')}
        >
          Entrada rapida
        </button>
      </div>

      {modo === 'biblioteca' ? (
        <div className="buscador">
          <input
            type="search"
            placeholder="Buscar alimento..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setElegido(null)
            }}
            aria-label="Buscar alimento"
          />

          {elegido ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="fila-item">
                <div className="info">
                  <div className="nombre">{elegido.nombre}</div>
                  <div className="detalle">
                    {elegido.kcal} kcal por {elegido.porcionBase} {elegido.unidad}
                  </div>
                </div>
                <button className="btn chico fantasma" onClick={() => setElegido(null)}>
                  Cambiar
                </button>
              </div>

              <div className="campo">
                <label htmlFor="cantidad">Cantidad ({elegido.unidad})</label>
                <input
                  id="cantidad"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  autoFocus
                />
              </div>

              {previsualizacion && (
                <div className="fila-item">
                  <div className="info">
                    <div className="detalle">
                      P {previsualizacion.proteina} g · C {previsualizacion.carbos} g · G{' '}
                      {previsualizacion.grasa} g
                    </div>
                  </div>
                  <div className="derecha">
                    <span className="kcal">{previsualizacion.kcal} kcal</span>
                  </div>
                </div>
              )}

              <button
                className="btn principal"
                onClick={agregarDeBiblioteca}
                disabled={!previsualizacion}
              >
                Anadir al diario
              </button>
            </div>
          ) : (
            <div className="resultados">
              {resultados.length === 0 && (
                <div className="vacio">
                  Sin coincidencias. Usa <strong>Entrada rapida</strong> para registrarlo a mano.
                </div>
              )}
              {resultados.map((a) => (
                <button key={a.id} className="resultado" onClick={() => elegir(a)}>
                  <span>
                    <span className="nombre">
                      {a.favorito && '★ '}
                      {a.nombre}
                    </span>
                    <br />
                    <span className="meta">
                      {a.marca ? `${a.marca} · ` : ''}
                      {a.kcal} kcal / {a.porcionBase} {a.unidad}
                    </span>
                  </span>
                  <span className="meta">
                    P {a.proteina} · C {a.carbos} · G {a.grasa}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="campo">
            <label htmlFor="r-nombre">Descripcion</label>
            <input
              id="r-nombre"
              value={rNombre}
              onChange={(e) => setRNombre(e.target.value)}
              placeholder="Comida fuera, tacos, etc."
            />
          </div>
          <div className="rejilla cuatro">
            <div className="campo">
              <label htmlFor="r-kcal">kcal</label>
              <input
                id="r-kcal"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={rKcal}
                onChange={(e) => setRKcal(e.target.value)}
                placeholder="auto"
              />
            </div>
            <div className="campo">
              <label htmlFor="r-prot">Prot. (g)</label>
              <input id="r-prot" type="number" min="0" step="any" inputMode="decimal" value={rProt} onChange={(e) => setRProt(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="r-carb">Carb. (g)</label>
              <input id="r-carb" type="number" min="0" step="any" inputMode="decimal" value={rCarb} onChange={(e) => setRCarb(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="r-grasa">Grasa (g)</label>
              <input id="r-grasa" type="number" min="0" step="any" inputMode="decimal" value={rGrasa} onChange={(e) => setRGrasa(e.target.value)} />
            </div>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem', color: 'var(--texto-2)' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={guardarEnBiblioteca}
              onChange={(e) => setGuardarEnBiblioteca(e.target.checked)}
            />
            Guardar tambien en mi biblioteca
          </label>
          <button className="btn principal" onClick={agregarRapida} disabled={!rNombre.trim()}>
            Anadir al diario
          </button>
          <p style={{ color: 'var(--texto-3)', fontSize: '0.76rem' }}>
            Si dejas las kcal vacias se calculan desde los macros (4/4/9).
          </p>
        </div>
      )}
    </div>
  )
}

function num(v: string): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export { MOMENTOS }
