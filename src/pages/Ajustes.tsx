import { useMemo, useState } from 'react'
import { Aviso, Metrica, Tarjeta } from '../components/Basicos'
import {
  exportarComidasCSV,
  exportarJSON,
  exportarPesosCSV,
  normalizar,
} from '../lib/almacen'
import { hoyISO } from '../lib/dates'
import { pesoVigente } from '../lib/estadisticas'
import {
  ETIQUETA_ACTIVIDAD,
  caloriasObjetivo,
  calcularTDEE,
  calcularTMB,
  macrosObjetivo,
  repartoInviable,
  repartoPorcentual,
} from '../lib/nutricion'
import { useApp } from '../state/store'
import type { NivelActividad, Objetivo, Sexo } from '../lib/types'

export function Ajustes() {
  const { estado, despachar, reiniciar } = useApp()
  const { perfil, ajustes } = estado
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [textoManual, setTextoManual] = useState<string | null>(null)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  // Los visores embebidos bloquean las descargas: ahi solo se ofrece copiar.
  const hayDescargas = !import.meta.env.VITE_EMBEBIDO

  const peso = useMemo(() => pesoVigente(estado.pesos, perfil, hoyISO()), [estado.pesos, perfil])
  const tmb = Math.round(calcularTMB(perfil, peso))
  const tdee = Math.round(calcularTDEE(perfil, peso))
  const kcal = caloriasObjetivo(perfil, peso)
  const macros = macrosObjetivo(perfil, peso)
  const reparto = repartoPorcentual(macros)
  const inviable = repartoInviable(perfil, peso)

  function actualizar<K extends keyof typeof perfil>(campo: K, valor: (typeof perfil)[K]) {
    despachar({ tipo: 'perfil/actualizar', datos: { [campo]: valor } as never })
  }

  function descargar(nombre: string, contenido: string, tipo: string) {
    const blob = new Blob([contenido], { type: tipo })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Alternativa a la descarga: hay entornos que la bloquean sin avisar.
   * Si tampoco hay portapapeles, se muestra el texto para copiarlo a mano.
   */
  async function copiar(contenido: string, etiqueta: string) {
    setTextoManual(null)
    try {
      await navigator.clipboard.writeText(contenido)
      setMensaje(`${etiqueta} copiado al portapapeles.`)
    } catch {
      setTextoManual(contenido)
      setMensaje(`No se pudo copiar solo. Selecciona el texto de abajo y copialo.`)
    }
  }

  function importar(archivo: File) {
    const lector = new FileReader()
    lector.onload = () => {
      try {
        const datos = normalizar(JSON.parse(String(lector.result)))
        despachar({ tipo: 'estado/reemplazar', estado: datos })
        setMensaje(
          `Importado: ${datos.comidas.length} comidas, ${datos.pesos.length} pesos, ${datos.alimentos.length} alimentos.`,
        )
      } catch {
        setMensaje('El archivo no es un respaldo valido.')
      }
    }
    lector.readAsText(archivo)
  }

  const fecha = hoyISO()

  return (
    <>
      <Tarjeta titulo="Tu perfil" sub="Se usa para calcular tu gasto energetico">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="campo">
            <label htmlFor="s-nombre">Nombre</label>
            <input
              id="s-nombre"
              value={perfil.nombre}
              onChange={(e) => actualizar('nombre', e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="rejilla dos">
            <div className="campo">
              <label htmlFor="s-sexo">Sexo</label>
              <select
                id="s-sexo"
                value={perfil.sexo}
                onChange={(e) => actualizar('sexo', e.target.value as Sexo)}
              >
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="s-edad">Edad</label>
              <input
                id="s-edad"
                type="number"
                min="10"
                max="110"
                inputMode="numeric"
                value={perfil.edad}
                onChange={(e) => actualizar('edad', Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="rejilla dos">
            <div className="campo">
              <label htmlFor="s-altura">Altura (cm)</label>
              <input
                id="s-altura"
                type="number"
                min="100"
                max="240"
                inputMode="numeric"
                value={perfil.alturaCm}
                onChange={(e) => actualizar('alturaCm', Number(e.target.value) || 0)}
              />
            </div>
            <div className="campo">
              <label htmlFor="s-peso-inicial">Peso de referencia (kg)</label>
              <input
                id="s-peso-inicial"
                type="number"
                min="20"
                step="0.1"
                inputMode="decimal"
                value={perfil.pesoInicialKg}
                onChange={(e) => actualizar('pesoInicialKg', Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="s-actividad">Nivel de actividad</label>
            <select
              id="s-actividad"
              value={perfil.nivelActividad}
              onChange={(e) => actualizar('nivelActividad', e.target.value as NivelActividad)}
            >
              {(Object.keys(ETIQUETA_ACTIVIDAD) as NivelActividad[]).map((k) => (
                <option key={k} value={k}>
                  {ETIQUETA_ACTIVIDAD[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Objetivo" sub="Define tu ritmo y el reparto de macros">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="rejilla dos">
            <div className="campo">
              <label htmlFor="s-objetivo">Meta</label>
              <select
                id="s-objetivo"
                value={perfil.objetivo}
                onChange={(e) => actualizar('objetivo', e.target.value as Objetivo)}
              >
                <option value="perder">Perder grasa</option>
                <option value="mantener">Mantener</option>
                <option value="ganar">Ganar masa</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="s-ritmo">Ritmo (kg/semana)</label>
              <input
                id="s-ritmo"
                type="number"
                min="0"
                max="1.5"
                step="0.05"
                inputMode="decimal"
                value={perfil.ritmoSemanalKg}
                onChange={(e) => actualizar('ritmoSemanalKg', Number(e.target.value) || 0)}
                disabled={perfil.objetivo === 'mantener'}
              />
            </div>
          </div>

          <div className="rejilla dos">
            <div className="campo">
              <label htmlFor="s-prot">Proteina (g/kg)</label>
              <input
                id="s-prot"
                type="number"
                min="0"
                max="4"
                step="0.1"
                inputMode="decimal"
                value={perfil.proteinaGPorKg}
                onChange={(e) => actualizar('proteinaGPorKg', Number(e.target.value) || 0)}
              />
            </div>
            <div className="campo">
              <label htmlFor="s-grasa">Grasa (g/kg)</label>
              <input
                id="s-grasa"
                type="number"
                min="0"
                max="3"
                step="0.05"
                inputMode="decimal"
                value={perfil.grasaGPorKg}
                onChange={(e) => actualizar('grasaGPorKg', Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="s-manual">Objetivo calorico manual (opcional)</label>
            <input
              id="s-manual"
              type="number"
              min="0"
              step="10"
              inputMode="numeric"
              value={perfil.caloriasObjetivoManual ?? ''}
              onChange={(e) =>
                actualizar('caloriasObjetivoManual', e.target.value ? Number(e.target.value) : null)
              }
              placeholder={`Calculado: ${kcal} kcal`}
            />
          </div>

          {inviable && (
            <Aviso tono="alerta">
              Proteina y grasa juntas superan tu objetivo calorico. Baja los g/kg o sube las
              calorias para que queden carbohidratos disponibles.
            </Aviso>
          )}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Tus numeros" sub={`Calculados con ${peso.toFixed(1)} kg`}>
        <div className="rejilla cuatro">
          <Metrica titulo="Metabolismo basal" valor={tmb} unidad="kcal" pie="Mifflin-St Jeor" tono="normal" />
          <Metrica titulo="Gasto diario" valor={tdee} unidad="kcal" pie="con actividad" tono="normal" />
          <Metrica titulo="Objetivo" valor={kcal} unidad="kcal" pie={perfil.caloriasObjetivoManual ? 'manual' : 'calculado'} tono="normal" />
          <Metrica
            titulo="Diferencia"
            valor={`${kcal - tdee > 0 ? '+' : ''}${kcal - tdee}`}
            unidad="kcal"
            pie="frente al gasto"
            tono="normal"
          />
        </div>
        <div className="separador" style={{ margin: '14px 0' }} />
        <div className="rejilla tres">
          <Metrica titulo="Proteina" valor={macros.proteina} unidad="g" pie={`${reparto.proteina} % kcal`} tono="normal" />
          <Metrica titulo="Carbohidratos" valor={macros.carbos} unidad="g" pie={`${reparto.carbos} % kcal`} tono="normal" />
          <Metrica titulo="Grasa" valor={macros.grasa} unidad="g" pie={`${reparto.grasa} % kcal`} tono="normal" />
        </div>
      </Tarjeta>

      <Tarjeta titulo="Preferencias">
        <div className="rejilla dos">
          <div className="campo">
            <label htmlFor="s-inicio">La semana empieza en</label>
            <select
              id="s-inicio"
              value={ajustes.inicioSemana}
              onChange={(e) =>
                despachar({
                  tipo: 'ajustes/actualizar',
                  datos: { inicioSemana: Number(e.target.value) as 0 | 1 },
                })
              }
            >
              <option value={1}>Lunes</option>
              <option value={0}>Domingo</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="s-tema">Tema</label>
            <select
              id="s-tema"
              value={ajustes.tema}
              onChange={(e) =>
                despachar({
                  tipo: 'ajustes/actualizar',
                  datos: { tema: e.target.value as 'oscuro' | 'claro' },
                })
              }
            >
              <option value="oscuro">Oscuro</option>
              <option value="claro">Claro</option>
            </select>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Tus datos" sub="Todo se guarda solo en este navegador">
        {mensaje && <Aviso>{mensaje}</Aviso>}
        {hayDescargas && (
          <div className="acciones" style={{ marginTop: mensaje ? 12 : 0 }}>
            <button
              className="btn"
              onClick={() => descargar(`fit-respaldo-${fecha}.json`, exportarJSON(estado), 'application/json')}
            >
              Descargar respaldo (JSON)
            </button>
            <button
              className="btn"
              onClick={() => descargar(`fit-comidas-${fecha}.csv`, exportarComidasCSV(estado), 'text/csv')}
            >
              Comidas (CSV)
            </button>
            <button
              className="btn"
              onClick={() => descargar(`fit-pesos-${fecha}.csv`, exportarPesosCSV(estado), 'text/csv')}
            >
              Pesos (CSV)
            </button>
          </div>
        )}

        <div className="acciones" style={{ marginTop: hayDescargas || mensaje ? 8 : 0 }}>
          <button className="btn fantasma" onClick={() => copiar(exportarJSON(estado), 'Respaldo')}>
            Copiar respaldo (JSON)
          </button>
          <button className="btn fantasma" onClick={() => copiar(exportarComidasCSV(estado), 'CSV de comidas')}>
            Copiar comidas
          </button>
          <button className="btn fantasma" onClick={() => copiar(exportarPesosCSV(estado), 'CSV de pesos')}>
            Copiar pesos
          </button>
        </div>
        <p style={{ color: 'var(--texto-3)', fontSize: '0.76rem', marginTop: 8 }}>
          {hayDescargas
            ? 'Si la descarga no funciona donde estes usando la app, copia el respaldo y pegalo en un archivo de texto.'
            : 'Aqui las descargas estan bloqueadas: copia el respaldo y pegalo en un archivo de texto para guardarlo.'}
        </p>

        {textoManual && (
          <div className="campo" style={{ marginTop: 12 }}>
            <label htmlFor="s-manual-texto">Copia este contenido</label>
            <textarea
              id="s-manual-texto"
              readOnly
              rows={6}
              value={textoManual}
              onFocus={(e) => e.currentTarget.select()}
              style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '0.75rem' }}
            />
          </div>
        )}

        <div className="campo" style={{ marginTop: 14 }}>
          <label htmlFor="s-importar">Importar respaldo JSON</label>
          <input
            id="s-importar"
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importar(f)
              e.target.value = ''
            }}
          />
          <p style={{ color: 'var(--texto-3)', fontSize: '0.76rem' }}>
            Importar reemplaza todos los datos actuales. Exporta antes si quieres conservarlos.
          </p>
        </div>

        <div className="separador" style={{ margin: '14px 0' }} />

        {confirmandoBorrado ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Aviso tono="alerta">
              Se borraran tus {estado.comidas.length} comidas y {estado.pesos.length} pesos de
              este navegador. No se puede deshacer. Exporta un respaldo antes si lo necesitas.
            </Aviso>
            <div className="acciones">
              <button className="btn peligro" onClick={reiniciar}>
                Si, borrar todo
              </button>
              <button className="btn fantasma" onClick={() => setConfirmandoBorrado(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button className="btn peligro" onClick={() => setConfirmandoBorrado(true)}>
            Borrar todos mis datos
          </button>
        )}
      </Tarjeta>
    </>
  )
}
