import { construirSerie, ticksDelEje } from './serie-litros';

describe('serie-litros', () => {
  describe('construirSerie', () => {
    it('builds one bar per day and fills days without deliveries with zero', () => {
      const serie = construirSerie('2026-09-01', '2026-09-30', [
        { fecha: '2026-09-01', litros: 1000, cantidadRecepciones: 1 },
        { fecha: '2026-09-03', litros: 2000, cantidadRecepciones: 2 },
      ]);

      expect(serie.agrupacion).toBe('dia');
      expect(serie.barras.length).toBe(30);
      expect(serie.barras.map((b) => b.litros).slice(0, 4)).toEqual([1000, 0, 2000, 0]);
      expect(serie.barras[2].titulo).toBe('03/09/2026: 2.000 L');
    });

    it('computes the daily average over every day of the range', () => {
      const serie = construirSerie('2026-09-01', '2026-09-30', [
        { fecha: '2026-09-01', litros: 3000, cantidadRecepciones: 1 },
      ]);

      expect(serie.promedioDiario).toBe(100);
    });

    it('divides the daily average by the days of the range up to today, not by the whole month', () => {
      // 14 elapsed days of October: 1.400 L / 14 = 100 L per day (not / 31)
      const serie = construirSerie('2026-10-01', '2026-10-14', [
        { fecha: '2026-10-02', litros: 1400, cantidadRecepciones: 1 },
      ]);

      expect(serie.barras.length).toBe(14);
      expect(serie.promedioDiario).toBe(100);
    });

    it('only labels some bars when there are many', () => {
      const serie = construirSerie('2026-09-01', '2026-09-30', []);
      const conEtiqueta = serie.barras.filter((b) => b.mostrarEtiqueta).length;

      expect(conEtiqueta).toBeLessThan(10);
      expect(serie.barras[0].mostrarEtiqueta).toBe(true);
    });

    it('groups into monthly bars when the range is over 62 days', () => {
      const serie = construirSerie('2026-01-01', '2026-12-31', [
        { fecha: '2026-01-05', litros: 100, cantidadRecepciones: 1 },
        { fecha: '2026-01-20', litros: 50, cantidadRecepciones: 1 },
        { fecha: '2026-03-10', litros: 70, cantidadRecepciones: 1 },
      ]);

      expect(serie.agrupacion).toBe('mes');
      expect(serie.barras.length).toBe(12);
      expect(serie.barras[0].etiqueta).toBe('Ene');
      expect(serie.barras[0].litros).toBe(150);
      expect(serie.barras[1].litros).toBe(0);
      expect(serie.barras[2].litros).toBe(70);
      expect(serie.barras[0].titulo).toBe('Enero 2026: 150 L');
    });

    it('keeps 62 days as daily bars and 63 as monthly', () => {
      expect(construirSerie('2026-01-01', '2026-03-03', []).agrupacion).toBe('dia'); // 62 days
      expect(construirSerie('2026-01-01', '2026-03-04', []).agrupacion).toBe('mes'); // 63 days
    });
  });

  describe('ticksDelEje', () => {
    it('returns round ticks that cover the maximum', () => {
      const ticks = ticksDelEje(27500);

      expect(ticks[0]).toBe(0);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(27500);
      expect(ticks.length).toBeLessThanOrEqual(5);
      expect(ticks).toEqual([0, 10000, 20000, 30000]);
    });

    it('handles an empty series', () => {
      expect(ticksDelEje(0)).toEqual([0, 1]);
    });
  });
});
