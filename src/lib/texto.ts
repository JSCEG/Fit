/** Normaliza texto para buscar sin acentos ni mayusculas. */
export function clave(texto: string): string {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
