import {
  ahoraEnPlanta,
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

  describe('ahoraEnPlanta', () => {
    it('is the plant wall-clock time as a datetime-local value', () => {
      // 15:30 UTC is 12:30 in Buenos Aires (UTC-3)
      expect(ahoraEnPlanta(new Date('2026-10-14T15:30:00Z'))).toBe('2026-10-14T12:30');
    });

    it('rolls back to the previous day and shows midnight as 00, not 24', () => {
      expect(ahoraEnPlanta(new Date('2026-10-14T02:05:00Z'))).toBe('2026-10-13T23:05');
      expect(ahoraEnPlanta(new Date('2026-10-14T03:00:00Z'))).toBe('2026-10-14T00:00');
    });
  });

  describe('in any browser time zone', () => {
    const proceso = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
      .process;
    const tzOriginal = proceso.env['TZ'];
    afterEach(() => {
      if (tzOriginal === undefined) {
        delete proceso.env['TZ'];
      } else {
        proceso.env['TZ'] = tzOriginal;
      }
    });

    // 2026-10-14T01:30Z is already the 14th in UTC, still the 13th at 22:30 in the plant and 21:30 in New York.
    const instante = new Date('2026-10-14T01:30:00Z');

    it.each(['UTC', 'America/New_York', 'Asia/Tokyo', 'America/Argentina/Buenos_Aires'])(
      'gives the plant date, time and ranges when the browser is in %s',
      (tz) => {
        proceso.env['TZ'] = tz;
        // the browser's own clock really differs between zones
        expect(new Date(instante).getHours()).toBe(
          Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(instante)),
        );

        expect(hoyEnPlanta(instante)).toBe('2026-10-13');
        expect(ahoraEnPlanta(instante)).toBe('2026-10-13T22:30');
        expect(rangoDePeriodo('semana', hoyEnPlanta(instante))).toEqual({
          desde: '2026-10-12',
          hasta: '2026-10-13',
        });
        expect(rangoDePeriodo('mes', hoyEnPlanta(instante))).toEqual({
          desde: '2026-10-01',
          hasta: '2026-10-13',
        });
      },
    );
  });

  describe('rangoDePeriodo', () => {
    it('dia is a single day', () => {
      expect(rangoDePeriodo('dia', '2026-10-14')).toEqual({
        desde: '2026-10-14',
        hasta: '2026-10-14',
      });
    });

    it('semana goes from Monday to today', () => {
      // 2026-10-14 is a Wednesday
      expect(rangoDePeriodo('semana', '2026-10-14')).toEqual({
        desde: '2026-10-12',
        hasta: '2026-10-14',
      });
    });

    it('semana on a Monday is just that day', () => {
      expect(rangoDePeriodo('semana', '2026-10-12')).toEqual({
        desde: '2026-10-12',
        hasta: '2026-10-12',
      });
    });

    it('semana on a Sunday covers the whole week', () => {
      expect(rangoDePeriodo('semana', '2026-10-18')).toEqual({
        desde: '2026-10-12',
        hasta: '2026-10-18',
      });
    });

    it('semana can start in the previous month and year', () => {
      // 2026-01-01 is a Thursday
      expect(rangoDePeriodo('semana', '2026-01-01')).toEqual({
        desde: '2025-12-29',
        hasta: '2026-01-01',
      });
    });

    it('mes goes from day 1 to today', () => {
      expect(rangoDePeriodo('mes', '2026-10-14')).toEqual({
        desde: '2026-10-01',
        hasta: '2026-10-14',
      });
    });

    it('mes on the last day of the month covers the whole month', () => {
      expect(rangoDePeriodo('mes', '2026-09-30')).toEqual({
        desde: '2026-09-01',
        hasta: '2026-09-30',
      });
    });

    it('anio goes from January 1 to today', () => {
      expect(rangoDePeriodo('anio', '2026-10-14')).toEqual({
        desde: '2026-01-01',
        hasta: '2026-10-14',
      });
    });

    it('never ends after today, whatever the period', () => {
      for (const hoy of ['2026-01-01', '2026-02-28', '2028-02-10', '2026-12-31']) {
        for (const preset of ['dia', 'semana', 'mes', 'anio'] as const) {
          const { desde, hasta } = rangoDePeriodo(preset, hoy);
          expect(hasta).toBe(hoy);
          expect(desde <= hasta).toBe(true);
        }
      }
    });

    it('the number of days counted is the days elapsed so far', () => {
      const { desde, hasta } = rangoDePeriodo('mes', '2026-10-14');
      expect(diasEnRango(desde, hasta)).toBe(14);
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
      expect(etiquetaPeriodo(r('semana'), 'semana')).toBe('Semana del 14/09/2026 al 16/09/2026');
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
