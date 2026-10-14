import {
  dateAIso,
  diasEnRango,
  etiquetaPeriodo,
  hoyEnPlanta,
  isoADate,
  rangoDePeriodo,
} from './periodos';

describe('periodos', () => {
  describe('hoyEnPlanta', () => {
    it('uses the plant time zone, not UTC', () => {
      // 02:00 UTC on the 14th is still 23:00 on the 13th in Buenos Aires (UTC-3)
      expect(hoyEnPlanta(new Date('2026-10-14T02:00:00Z'))).toBe('2026-10-13');
    });

    it('returns the same day when UTC and plant date agree', () => {
      expect(hoyEnPlanta(new Date('2026-10-14T15:00:00Z'))).toBe('2026-10-14');
    });
  });

  describe('rangoDePeriodo', () => {
    it('dia is a single day', () => {
      expect(rangoDePeriodo('dia', '2026-10-14')).toEqual({
        desde: '2026-10-14',
        hasta: '2026-10-14',
      });
    });

    it('semana goes from Monday to Sunday', () => {
      // 2026-10-14 is a Wednesday
      expect(rangoDePeriodo('semana', '2026-10-14')).toEqual({
        desde: '2026-10-12',
        hasta: '2026-10-18',
      });
    });

    it('semana on a Monday starts that same day', () => {
      expect(rangoDePeriodo('semana', '2026-10-12')).toEqual({
        desde: '2026-10-12',
        hasta: '2026-10-18',
      });
    });

    it('semana on a Sunday ends that same day', () => {
      expect(rangoDePeriodo('semana', '2026-10-18')).toEqual({
        desde: '2026-10-12',
        hasta: '2026-10-18',
      });
    });

    it('semana can cross a month and year boundary', () => {
      // 2026-01-01 is a Thursday
      expect(rangoDePeriodo('semana', '2026-01-01')).toEqual({
        desde: '2025-12-29',
        hasta: '2026-01-04',
      });
    });

    it('mes covers the whole current month', () => {
      expect(rangoDePeriodo('mes', '2026-09-14')).toEqual({
        desde: '2026-09-01',
        hasta: '2026-09-30',
      });
    });

    it('mes handles leap-year February and 31-day months', () => {
      expect(rangoDePeriodo('mes', '2028-02-10').hasta).toBe('2028-02-29');
      expect(rangoDePeriodo('mes', '2026-10-14').hasta).toBe('2026-10-31');
    });

    it('anio covers January 1 to December 31', () => {
      expect(rangoDePeriodo('anio', '2026-10-14')).toEqual({
        desde: '2026-01-01',
        hasta: '2026-12-31',
      });
    });
  });

  describe('diasEnRango', () => {
    it('counts both ends', () => {
      expect(diasEnRango('2026-10-14', '2026-10-14')).toBe(1);
      expect(diasEnRango('2026-10-01', '2026-10-31')).toBe(31);
    });
  });

  describe('etiquetaPeriodo', () => {
    it('describes each preset', () => {
      const r = (preset: 'dia' | 'semana' | 'mes' | 'anio') => rangoDePeriodo(preset, '2026-09-16');
      expect(etiquetaPeriodo(r('mes'), 'mes')).toBe('Septiembre 2026');
      expect(etiquetaPeriodo(r('anio'), 'anio')).toBe('2026');
      expect(etiquetaPeriodo(r('dia'), 'dia')).toBe('16/09/2026');
      expect(etiquetaPeriodo(r('semana'), 'semana')).toBe('Semana del 14/09/2026 al 20/09/2026');
    });

    it('shows the dates for a custom range', () => {
      expect(etiquetaPeriodo({ desde: '2026-09-01', hasta: '2026-09-30' }, null)).toBe(
        '01/09/2026 – 30/09/2026',
      );
    });
  });

  describe('isoADate / dateAIso', () => {
    it('round-trips without shifting the day', () => {
      expect(dateAIso(isoADate('2026-03-01'))).toBe('2026-03-01');
      expect(dateAIso(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    });
  });
});
