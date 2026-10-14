import { diasEnRango, hoyEnPlanta, rangoDePeriodo } from './periodos';

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
    it('hoy is a single day', () => {
      expect(rangoDePeriodo('hoy', '2026-10-14')).toEqual({
        desde: '2026-10-14',
        hasta: '2026-10-14',
      });
    });

    it('ultimos-7 includes today and the 6 previous days', () => {
      expect(rangoDePeriodo('ultimos-7', '2026-10-14')).toEqual({
        desde: '2026-10-08',
        hasta: '2026-10-14',
      });
    });

    it('ultimos-30 crosses month and year boundaries', () => {
      expect(rangoDePeriodo('ultimos-30', '2026-01-10')).toEqual({
        desde: '2025-12-12',
        hasta: '2026-01-10',
      });
    });

    it('este-mes goes from day 1 to today', () => {
      expect(rangoDePeriodo('este-mes', '2026-10-14')).toEqual({
        desde: '2026-10-01',
        hasta: '2026-10-14',
      });
    });

    it('mes-anterior covers the whole previous month', () => {
      expect(rangoDePeriodo('mes-anterior', '2026-10-14')).toEqual({
        desde: '2026-09-01',
        hasta: '2026-09-30',
      });
    });

    it('mes-anterior in January goes back to December of the previous year', () => {
      expect(rangoDePeriodo('mes-anterior', '2026-01-05')).toEqual({
        desde: '2025-12-01',
        hasta: '2025-12-31',
      });
    });

    it('mes-anterior handles leap-year February', () => {
      expect(rangoDePeriodo('mes-anterior', '2028-03-10')).toEqual({
        desde: '2028-02-01',
        hasta: '2028-02-29',
      });
    });
  });

  describe('diasEnRango', () => {
    it('counts both ends', () => {
      expect(diasEnRango('2026-10-14', '2026-10-14')).toBe(1);
      expect(diasEnRango('2026-10-01', '2026-10-31')).toBe(31);
    });
  });
});
