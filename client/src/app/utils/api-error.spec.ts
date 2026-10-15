import { HttpErrorResponse } from '@angular/common/http';
import { getApiErrorMessage } from './api-error';

const error = (status: number, body: unknown) => new HttpErrorResponse({ status, error: body });

describe('getApiErrorMessage', () => {
  it('returns the server message for a 409 conflict', () => {
    const err = error(409, { error: 'El ticket 6311 ya está registrado (Tambo X, 11/10/2026)' });

    expect(getApiErrorMessage(err, 'fallback')).toBe(
      'El ticket 6311 ya está registrado (Tambo X, 11/10/2026)',
    );
  });

  it('returns the domain message for a 400', () => {
    expect(getApiErrorMessage(error(400, { error: 'Dato inválido' }), 'fallback')).toBe(
      'Dato inválido',
    );
  });

  it('returns the first model validation message for a 400', () => {
    const err = error(400, { errors: { litros: ['Requerido'] } });

    expect(getApiErrorMessage(err, 'fallback')).toBe('Requerido');
  });

  it('returns the connection message when the server is unreachable', () => {
    expect(getApiErrorMessage(error(0, null), 'fallback')).toBe(
      'No se pudo conectar con el servidor.',
    );
  });

  it('returns the fallback for other errors', () => {
    expect(getApiErrorMessage(error(500, { error: 'x' }), 'fallback')).toBe('fallback');
  });
});
