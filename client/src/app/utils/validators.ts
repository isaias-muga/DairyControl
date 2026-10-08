import { ValidatorFn } from '@angular/forms';

/** Fails when the value is greater than or equal to the limit (mirrors the domain's `>= MaxValue` check). */
export function lessThan(limit: number): ValidatorFn {
  return (control) =>
    control.value !== null && control.value !== '' && control.value >= limit
      ? { lessThan: { limit } }
      : null;
}
