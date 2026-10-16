import { litrosReales, motivosFueraDeRango } from './calidad';

const LIMITES = { acidezMaxima: 19, temperaturaMaxima: 20, aguaMaxima: 0 };

describe('calidad', () => {
  describe('litrosReales', () => {
    it.each([
      [1905, 1.5, 1876.425],
      [2150, 0, 2150],
      [2150, null, 2150],
      [2150, undefined, 2150],
      [1214.333, null, 1214.333],
      [1000, 100, 0],
      [30000, 0.01, 29997],
    ])('liters %s with water %s are %s real liters', (litros, agua, esperado) => {
      expect(litrosReales(litros, agua)).toBe(esperado);
    });

    it('rounds to 3 decimals like the API', () => {
      expect(litrosReales(1000.001, 33.33)).toBe(666.701);
    });
  });

  describe('motivosFueraDeRango', () => {
    const lectura = (acidez: number | null, temperatura: number | null, aguaPorcentaje: number | null) => ({
      acidez, temperatura, aguaPorcentaje,
    });

    it('returns no reasons for a reading on the limits', () => {
      expect(motivosFueraDeRango(LIMITES, lectura(19, 20, 0))).toEqual([]);
    });

    it.each([
      [lectura(19.01, 20, 0), ['Acidez']],
      [lectura(19, 20.01, 0), ['Temperatura']],
      [lectura(19, 20, 0.01), ['Agua']],
      [lectura(25, 30, 5), ['Acidez', 'Temperatura', 'Agua']],
    ])('flags what is above the limits in %o', (valores, esperado) => {
      expect(motivosFueraDeRango(LIMITES, valores)).toEqual(esperado);
    });

    it('counts a missing water as 0 and ignores readings that are not typed yet', () => {
      expect(motivosFueraDeRango(LIMITES, lectura(null, null, null))).toEqual([]);
    });

    it('uses the limits it is given', () => {
      expect(motivosFueraDeRango({ acidezMaxima: 25, temperaturaMaxima: 30, aguaMaxima: 5 }, lectura(24, 29, 4))).toEqual([]);
    });
  });
});
