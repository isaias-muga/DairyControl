import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProveedoresService } from '../../services/proveedores';
import { RegistrarRecepcion } from '../../models/proveedor';
import {
  LITROS_MAX_EXCLUSIVE,
  LITROS_MIN,
  OBSERVACIONES_MAX_LENGTH,
  PARAMETRO_MAX_EXCLUSIVE,
} from '../../models/limits';
import { lessThan } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/api-error';

function ahoraLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

@Component({
  selector: 'app-recepcion-form',
  imports: [ReactiveFormsModule],
  templateUrl: './recepcion-form.html',
  styleUrl: './recepcion-form.css',
})
export class RecepcionForm {
  private proveedoresService = inject(ProveedoresService);
  private fb = inject(FormBuilder);

  proveedorId = input.required<string>();
  registrada = output<void>();

  readonly observacionesMaxLength = OBSERVACIONES_MAX_LENGTH;

  form = this.fb.group({
    fechaHora: [ahoraLocal(), Validators.required],
    litros: [
      null as number | null,
      [Validators.required, Validators.min(LITROS_MIN), lessThan(LITROS_MAX_EXCLUSIVE)],
    ],
    grasa: [null as number | null, [Validators.min(0), lessThan(PARAMETRO_MAX_EXCLUSIVE)]],
    acidez: [
      null as number | null,
      [Validators.required, Validators.min(0), lessThan(PARAMETRO_MAX_EXCLUSIVE)],
    ],
    temperatura: [
      null as number | null,
      [Validators.required, Validators.min(0), lessThan(PARAMETRO_MAX_EXCLUSIVE)],
    ],
    silo: [null as number | null, [Validators.min(1), Validators.pattern(/^\d+$/)]],
    observaciones: ['', Validators.maxLength(OBSERVACIONES_MAX_LENGTH)],
  });

  saving = signal(false);
  saveError = signal<string | null>(null);

  invalid(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.touched && c.invalid;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const recepcion: RegistrarRecepcion = {
      fechaHora: v.fechaHora!,
      litros: v.litros!,
      grasa: v.grasa,
      acidez: v.acidez!,
      temperatura: v.temperatura!,
      silo: v.silo,
      observaciones: v.observaciones?.trim() || null,
    };

    this.saving.set(true);
    this.saveError.set(null);

    this.proveedoresService.registrarRecepcion(this.proveedorId(), recepcion).subscribe({
      next: () => {
        this.form.reset({ fechaHora: ahoraLocal(), observaciones: '' });
        this.saving.set(false);
        this.registrada.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.saveError.set(getApiErrorMessage(err, 'No se pudo registrar la recepción.'));
        this.saving.set(false);
      },
    });
  }
}
