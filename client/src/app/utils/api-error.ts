import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(err: HttpErrorResponse, fallback: string): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor.';
  }

  if (err.status === 400) {
    // Domain validation, from ExceptionHandlingMiddleware: { error: "..." }
    if (typeof err.error?.error === 'string') {
      return err.error.error;
    }

    // ASP.NET model validation: { errors: { field: ["..."] } }
    const errors = err.error?.errors as Record<string, string[]> | undefined;
    if (errors) {
      const first = Object.values(errors)[0];
      if (first?.length) {
        return first[0];
      }
    }
  }

  return fallback;
}
