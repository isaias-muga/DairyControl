import { FormControl } from '@angular/forms';
import { errorNumero, formatearNumeroEs, parsearNumeroEs } from './numero-es';

describe('parsearNumeroEs', () => {
  const validos: [string, number | null][] = [
    ['', null],
    ['   ', null],
    ['1234', 1234],
    ['007', 7],
    ['3,5', 3.5],
    ['3.5', 3.5],
    [' 3,5 ', 3.5],
    ['1234,5', 1234.5],
    ['1234.5', 1234.5],
    ['1.234,5', 1234.5],
    ['12.345,678', 12345.678],
    ['1.234', 1234],
    ['12.345', 12345],
    ['1.234.567', 1234567],
    ['0,001', 0.001],
    ['0.001', 0.001],
    ['1234.567', 1234.567],
    [',5', 0.5],
    ['5,0', 5],
  ];
  it.each(validos)('decimal field: "%s" is %s', (texto, esperado) => {
    // Arrange / Act
    const resultado = parsearNumeroEs(texto);

    // Assert
    expect(resultado).toEqual({ ok: true, valor: esperado });
  });

  const rechazados = [
    '1.2.3', // ambiguous grouping
    '1,2,3',
    '1,234.5', // en-US order
    '12.34,5',
    '12.34.567',
    '0.500.000',
    '5,',
    '5.',
    '.5',
    'abc',
    '3,5 L',
    '1 234',
    '-5',
    '+5',
    '1e3',
    'NaN',
    'Infinity',
    '<script>',
    '1; DROP TABLE',
    '1234567890123456', // more than 15 digits
    '١٢٣', // non-ASCII digits
  ];
  it.each(rechazados)('decimal field: "%s" is rejected with a message', (texto) => {
    // Arrange / Act
    const resultado = parsearNumeroEs(texto);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.ok ? '' : resultado.mensaje).not.toBe('');
  });

  const enteros: [string, number | null][] = [
    ['', null],
    ['12', 12],
    ['1.234', 1234],
    ['2.147.483.647', 2147483647],
    [' 7 ', 7],
  ];
  it.each(enteros)('integer field: "%s" is %s', (texto, esperado) => {
    // Arrange / Act
    const resultado = parsearNumeroEs(texto, { entero: true });

    // Assert
    expect(resultado).toEqual({ ok: true, valor: esperado });
  });

  it.each(['3,5', '3.5', '5,0', '1.234,5', '1.5', '1,5'])('integer field: "%s" is rejected as a decimal', (texto) => {
    // Arrange / Act
    const resultado = parsearNumeroEs(texto, { entero: true });

    // Assert
    expect(resultado).toEqual({ ok: false, mensaje: 'Ingresá un número entero, sin decimales.' });
  });

  it('1.234,5 is never read as 1.2345', () => {
    // Arrange / Act
    const resultado = parsearNumeroEs('1.234,5');

    // Assert
    expect(resultado).toEqual({ ok: true, valor: 1234.5 });
  });
});

describe('formatearNumeroEs', () => {
  const casos: [number | null, boolean, string][] = [
    [1234.5, false, '1.234,5'],
    [1234, false, '1.234'], // es-AR groups four digits too
    [3.5, false, '3,5'],
    [0.001, false, '0,001'],
    [30000, false, '30.000'],
    [1000001, true, '1000001'], // identifiers are never grouped
    [7, true, '7'],
    [null, false, ''],
  ];
  it.each(casos)('%s (entero=%s) shows "%s"', (valor, entero, esperado) => {
    // Arrange / Act
    const texto = formatearNumeroEs(valor, { entero });

    // Assert
    expect(texto).toBe(esperado);
  });

  it('what is shown is read back as the same number', () => {
    // Arrange
    const valor = 12345.678;

    // Act
    const resultado = parsearNumeroEs(formatearNumeroEs(valor));

    // Assert
    expect(resultado).toEqual({ ok: true, valor });
  });
});

describe('errorNumero', () => {
  it('returns the parser message when present and the default otherwise', () => {
    // Arrange
    const conError = new FormControl(null);
    conError.setErrors({ numero: 'Mensaje del parser' });
    const sinError = new FormControl(null);

    // Act / Assert
    expect(errorNumero(conError, 'Por defecto')).toBe('Mensaje del parser');
    expect(errorNumero(sinError, 'Por defecto')).toBe('Por defecto');
  });
});
