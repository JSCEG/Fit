import type { Alimento } from './types'

type Semilla = Omit<Alimento, 'id' | 'favorito'> & { favorito?: boolean }

/**
 * Biblioteca inicial de alimentos comunes. Los valores son por 100 g / 100 ml
 * salvo que la unidad sea "pieza". Son referencias aproximadas: se pueden
 * editar y ampliar desde la pantalla de Alimentos.
 */
const SEMILLAS: Semilla[] = [
  // Proteinas
  { nombre: 'Pechuga de pollo', marca: 'cruda', porcionBase: 100, unidad: 'g', kcal: 165, proteina: 31, carbos: 0, grasa: 3.6, favorito: true },
  { nombre: 'Pechuga de pavo', marca: 'cruda', porcionBase: 100, unidad: 'g', kcal: 135, proteina: 29, carbos: 0, grasa: 1 },
  { nombre: 'Carne de res magra', marca: '', porcionBase: 100, unidad: 'g', kcal: 217, proteina: 26, carbos: 0, grasa: 12 },
  { nombre: 'Lomo de cerdo', marca: '', porcionBase: 100, unidad: 'g', kcal: 143, proteina: 26, carbos: 0, grasa: 3.5 },
  { nombre: 'Huevo entero', marca: 'pieza M (~50 g)', porcionBase: 1, unidad: 'pieza', kcal: 72, proteina: 6.3, carbos: 0.4, grasa: 4.8, favorito: true },
  { nombre: 'Clara de huevo', marca: '', porcionBase: 100, unidad: 'g', kcal: 52, proteina: 11, carbos: 0.7, grasa: 0.2 },
  { nombre: 'Atun en agua', marca: 'lata escurrida', porcionBase: 100, unidad: 'g', kcal: 116, proteina: 26, carbos: 0, grasa: 0.8, favorito: true },
  { nombre: 'Salmon', marca: '', porcionBase: 100, unidad: 'g', kcal: 208, proteina: 20, carbos: 0, grasa: 13 },
  { nombre: 'Pescado blanco (merluza)', marca: '', porcionBase: 100, unidad: 'g', kcal: 86, proteina: 18, carbos: 0, grasa: 1 },
  { nombre: 'Camaron', marca: '', porcionBase: 100, unidad: 'g', kcal: 99, proteina: 24, carbos: 0.2, grasa: 0.3 },
  { nombre: 'Jamon cocido / de pavo', marca: '', porcionBase: 100, unidad: 'g', kcal: 104, proteina: 17, carbos: 1.5, grasa: 3 },
  { nombre: 'Jamon serrano', marca: '', porcionBase: 100, unidad: 'g', kcal: 241, proteina: 31, carbos: 0.3, grasa: 12.9 },
  { nombre: 'Tofu firme', marca: '', porcionBase: 100, unidad: 'g', kcal: 76, proteina: 8, carbos: 1.9, grasa: 4.8 },
  { nombre: 'Proteina en polvo', marca: 'scoop 30 g', porcionBase: 30, unidad: 'g', kcal: 120, proteina: 24, carbos: 3, grasa: 1.5, favorito: true },

  // Lacteos
  { nombre: 'Leche entera', marca: '', porcionBase: 100, unidad: 'ml', kcal: 61, proteina: 3.2, carbos: 4.8, grasa: 3.3 },
  { nombre: 'Leche desnatada', marca: '', porcionBase: 100, unidad: 'ml', kcal: 34, proteina: 3.4, carbos: 5, grasa: 0.1 },
  { nombre: 'Yogur griego natural', marca: '', porcionBase: 100, unidad: 'g', kcal: 97, proteina: 9, carbos: 3.6, grasa: 5, favorito: true },
  { nombre: 'Queso fresco', marca: '', porcionBase: 100, unidad: 'g', kcal: 98, proteina: 11, carbos: 3.4, grasa: 4.3 },
  { nombre: 'Queso curado', marca: '', porcionBase: 100, unidad: 'g', kcal: 380, proteina: 25, carbos: 1.5, grasa: 30 },

  // Cereales y tuberculos
  { nombre: 'Arroz blanco', marca: 'cocido', porcionBase: 100, unidad: 'g', kcal: 130, proteina: 2.7, carbos: 28, grasa: 0.3, favorito: true },
  { nombre: 'Arroz integral', marca: 'cocido', porcionBase: 100, unidad: 'g', kcal: 112, proteina: 2.6, carbos: 24, grasa: 0.9 },
  { nombre: 'Pasta', marca: 'cocida', porcionBase: 100, unidad: 'g', kcal: 158, proteina: 5.8, carbos: 31, grasa: 0.9 },
  { nombre: 'Avena en hojuelas', marca: '', porcionBase: 100, unidad: 'g', kcal: 389, proteina: 16.9, carbos: 66, grasa: 6.9, favorito: true },
  { nombre: 'Pan integral', marca: '', porcionBase: 100, unidad: 'g', kcal: 247, proteina: 13, carbos: 41, grasa: 3.4 },
  { nombre: 'Tortilla de maiz', marca: 'pieza ~30 g', porcionBase: 1, unidad: 'pieza', kcal: 63, proteina: 1.6, carbos: 13, grasa: 0.7 },
  { nombre: 'Papa', marca: 'cocida', porcionBase: 100, unidad: 'g', kcal: 87, proteina: 2, carbos: 20, grasa: 0.1 },
  { nombre: 'Camote / batata', marca: 'cocido', porcionBase: 100, unidad: 'g', kcal: 86, proteina: 1.6, carbos: 20, grasa: 0.1 },

  // Legumbres
  { nombre: 'Lentejas', marca: 'cocidas', porcionBase: 100, unidad: 'g', kcal: 116, proteina: 9, carbos: 20, grasa: 0.4 },
  { nombre: 'Garbanzos', marca: 'cocidos', porcionBase: 100, unidad: 'g', kcal: 164, proteina: 8.9, carbos: 27, grasa: 2.6 },
  { nombre: 'Frijoles negros', marca: 'cocidos', porcionBase: 100, unidad: 'g', kcal: 132, proteina: 8.9, carbos: 24, grasa: 0.5 },

  // Grasas
  { nombre: 'Aceite de oliva', marca: '', porcionBase: 100, unidad: 'ml', kcal: 884, proteina: 0, carbos: 0, grasa: 100, favorito: true },
  { nombre: 'Aguacate', marca: '', porcionBase: 100, unidad: 'g', kcal: 160, proteina: 2, carbos: 8.5, grasa: 14.7 },
  { nombre: 'Almendras', marca: '', porcionBase: 100, unidad: 'g', kcal: 579, proteina: 21, carbos: 22, grasa: 50 },
  { nombre: 'Crema de cacahuate', marca: '', porcionBase: 100, unidad: 'g', kcal: 588, proteina: 25, carbos: 20, grasa: 50 },

  // Frutas y verduras
  { nombre: 'Platano', marca: '', porcionBase: 100, unidad: 'g', kcal: 89, proteina: 1.1, carbos: 23, grasa: 0.3, favorito: true },
  { nombre: 'Manzana', marca: '', porcionBase: 100, unidad: 'g', kcal: 52, proteina: 0.3, carbos: 14, grasa: 0.2 },
  { nombre: 'Naranja', marca: '', porcionBase: 100, unidad: 'g', kcal: 47, proteina: 0.9, carbos: 12, grasa: 0.1 },
  { nombre: 'Fresas', marca: '', porcionBase: 100, unidad: 'g', kcal: 32, proteina: 0.7, carbos: 7.7, grasa: 0.3 },
  { nombre: 'Brocoli', marca: '', porcionBase: 100, unidad: 'g', kcal: 34, proteina: 2.8, carbos: 7, grasa: 0.4 },
  { nombre: 'Espinaca', marca: '', porcionBase: 100, unidad: 'g', kcal: 23, proteina: 2.9, carbos: 3.6, grasa: 0.4 },
  { nombre: 'Tomate', marca: '', porcionBase: 100, unidad: 'g', kcal: 18, proteina: 0.9, carbos: 3.9, grasa: 0.2 },
  { nombre: 'Lechuga', marca: '', porcionBase: 100, unidad: 'g', kcal: 15, proteina: 1.4, carbos: 2.9, grasa: 0.2 },

  // Otros
  { nombre: 'Chocolate negro 70 %', marca: '', porcionBase: 100, unidad: 'g', kcal: 598, proteina: 7.8, carbos: 46, grasa: 43 },
  { nombre: 'Miel', marca: '', porcionBase: 100, unidad: 'g', kcal: 304, proteina: 0.3, carbos: 82, grasa: 0 },
  { nombre: 'Azucar', marca: '', porcionBase: 100, unidad: 'g', kcal: 387, proteina: 0, carbos: 100, grasa: 0 },
  { nombre: 'Cerveza', marca: '', porcionBase: 100, unidad: 'ml', kcal: 43, proteina: 0.5, carbos: 3.6, grasa: 0 },
]

export function alimentosIniciales(): Alimento[] {
  return SEMILLAS.map((s, i) => ({
    ...s,
    id: `base-${i}`,
    favorito: s.favorito ?? false,
  }))
}
