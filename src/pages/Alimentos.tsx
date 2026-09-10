import { useMemo, useState } from 'react'
import { Tarjeta, Vacio } from '../components/Basicos'
import { kcalDesdeMacros } from '../lib/nutricion'
import { clave } from '../lib/texto'
import { useApp } from '../state/store'
import type { Alimento, Unidad } from '../lib/types'

const VACIO = {
  nombre: '',
  marca: '',
  porcionBase: '100',
  unidad: 'g' as Unidad,
  kcal: '',
  proteina: '',
  carbos: '',
  grasa: '',
}

export function Alimentos() {
  const { estado, despachar } = useApp()
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(VACIO)
  const [editando, setEditando] = useState<string | null>(null)
  const [soloFavoritos, setSoloFavoritos] = useState(false)

  const lista = useMemo(() => {
    const q = clave(busqueda.trim())
    return [...estado.alimentos]
      .filter((a) => (soloFavoritos ? a.favorito : true))
      .filter((a) => (q ? clave(`${a.nombre} ${a.marca}`).includes(q) : true))
      .sort((a, b) => {
        if (a.favorito !== b.favorito) return a.favorito ? -1 : 1
        return a.nombre.localeCompare(b.nombre)
      })
  }, [estado.alimentos, busqueda, soloFavoritos])

  const kcalSugeridas = kcalDesdeMacros({
    proteina: num(form.proteina),
    carbos: num(form.carbos),
    grasa: num(form.grasa),
  })

  function guardar() {
    if (!form.nombre.trim()) return
    const datos = {
      nombre: form.nombre.trim(),
      marca: form.marca.trim(),
      porcionBase: num(form.porcionBase) || 100,
      unidad: form.unidad,
      kcal: form.kcal.trim() ? num(form.kcal) : kcalSugeridas,
      proteina: num(form.proteina),
      carbos: num(form.carbos),
      grasa: num(form.grasa),
    }
    if (editando) {
      despachar({ tipo: 'alimento/actualizar', id: editando, datos })
    } else {
      despachar({ tipo: 'alimento/agregar', alimento: { ...datos, favorito: false } })
    }
    setForm(VACIO)
    setEditando(null)
  }

  function editar(a: Alimento) {
    setEditando(a.id)
    setForm({
      nombre: a.nombre,
      marca: a.marca,
      porcionBase: String(a.porcionBase),
      unidad: a.unidad,
      kcal: String(a.kcal),
      proteina: String(a.proteina),
      carbos: String(a.carbos),
      grasa: String(a.grasa),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Tarjeta
        titulo={editando ? 'Editar alimento' : 'Nuevo alimento'}
        sub="Los macros se guardan por la porcion base que indiques"
        accion={
          editando ? (
            <button
              className="btn chico fantasma"
              onClick={() => {
                setEditando(null)
                setForm(VACIO)
              }}
            >
              Cancelar
            </button>
          ) : undefined
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="rejilla dos">
            <div className="campo">
              <label htmlFor="a-nombre">Nombre</label>
              <input
                id="a-nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Pechuga de pollo"
              />
            </div>
            <div className="campo">
              <label htmlFor="a-marca">Marca o nota</label>
              <input
                id="a-marca"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                placeholder="cruda, marca X..."
              />
            </div>
          </div>

          <div className="rejilla dos">
            <div className="campo">
              <label htmlFor="a-porcion">Porcion base</label>
              <input
                id="a-porcion"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form.porcionBase}
                onChange={(e) => setForm({ ...form, porcionBase: e.target.value })}
              />
            </div>
            <div className="campo">
              <label htmlFor="a-unidad">Unidad</label>
              <select
                id="a-unidad"
                value={form.unidad}
                onChange={(e) => setForm({ ...form, unidad: e.target.value as Unidad })}
              >
                <option value="g">gramos</option>
                <option value="ml">mililitros</option>
                <option value="pieza">piezas</option>
              </select>
            </div>
          </div>

          <div className="rejilla cuatro">
            <div className="campo">
              <label htmlFor="a-kcal">kcal</label>
              <input
                id="a-kcal"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form.kcal}
                onChange={(e) => setForm({ ...form, kcal: e.target.value })}
                placeholder={kcalSugeridas ? String(kcalSugeridas) : 'auto'}
              />
            </div>
            <div className="campo">
              <label htmlFor="a-prot">Prot. (g)</label>
              <input id="a-prot" type="number" min="0" step="any" inputMode="decimal" value={form.proteina} onChange={(e) => setForm({ ...form, proteina: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="a-carb">Carb. (g)</label>
              <input id="a-carb" type="number" min="0" step="any" inputMode="decimal" value={form.carbos} onChange={(e) => setForm({ ...form, carbos: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="a-grasa">Grasa (g)</label>
              <input id="a-grasa" type="number" min="0" step="any" inputMode="decimal" value={form.grasa} onChange={(e) => setForm({ ...form, grasa: e.target.value })} />
            </div>
          </div>

          <button className="btn principal" onClick={guardar} disabled={!form.nombre.trim()}>
            {editando ? 'Guardar cambios' : 'Anadir a mi biblioteca'}
          </button>
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="Mi biblioteca"
        sub={`${estado.alimentos.length} alimentos`}
        accion={
          <button
            className={`btn chico ${soloFavoritos ? 'principal' : 'fantasma'}`}
            onClick={() => setSoloFavoritos((v) => !v)}
          >
            ★ Favoritos
          </button>
        }
      >
        <input
          type="search"
          placeholder="Buscar en la biblioteca..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar alimento"
          style={{ marginBottom: 12 }}
        />

        {lista.length === 0 ? (
          <Vacio>Sin resultados.</Vacio>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lista.map((a) => (
              <div className="fila-item" key={a.id}>
                <div className="info">
                  <div className="nombre">{a.nombre}</div>
                  <div className="detalle">
                    {a.marca ? `${a.marca} · ` : ''}
                    {a.kcal} kcal / {a.porcionBase} {a.unidad} · P {a.proteina} · C {a.carbos} · G{' '}
                    {a.grasa}
                  </div>
                </div>
                <div className="derecha">
                  <button
                    className="icono-btn"
                    style={{ color: a.favorito ? 'var(--grasa)' : undefined }}
                    onClick={() =>
                      despachar({
                        tipo: 'alimento/actualizar',
                        id: a.id,
                        datos: { favorito: !a.favorito },
                      })
                    }
                    aria-label={a.favorito ? 'Quitar de favoritos' : 'Marcar favorito'}
                    title="Favorito"
                  >
                    ★
                  </button>
                  <button className="btn chico fantasma" onClick={() => editar(a)}>
                    Editar
                  </button>
                  <button
                    className="icono-btn"
                    onClick={() => despachar({ tipo: 'alimento/eliminar', id: a.id })}
                    aria-label={`Eliminar ${a.nombre}`}
                    title="Eliminar"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>
    </>
  )
}

function num(v: string): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
