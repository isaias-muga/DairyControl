import { ValidatorFn } from '@angular/forms';

/** Fails when the value is less than or equal to the limit (mirrors the domain's `> 0` check for litros). */
export function greaterThan(limit: number): ValidatorFn {
  return (control) =>
    control.value !== null && control.value !== '' && control.value <= limit
      ? { greaterThan: { limit } }
      : null;
}
