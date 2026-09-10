import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Mide el ancho real del contenedor para que el SVG se dibuje 1:1 en pixeles.
 * Sin esto habria que estirar el viewBox y el texto saldria deformado.
 */
export function usarAncho<T extends HTMLElement>(
  porDefecto = 640,
): [RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [ancho, setAncho] = useState(porDefecto)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const medir = () => {
      const w = Math.round(el.getBoundingClientRect().width)
      if (w > 0) setAncho(w)
    }
    medir()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medir)
      return () => window.removeEventListener('resize', medir)
    }
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return [ref, ancho]
}
