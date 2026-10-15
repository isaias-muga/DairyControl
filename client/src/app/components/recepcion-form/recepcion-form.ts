import { Component, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProveedoresService } from '../../services/proveedores';
import { RegistrarRecepcion } from '../../models/proveedor';
import {
  ACIDEZ_MAX,
  ACIDEZ_MIN,
  AGUA_MAX_PORCENTAJE,
  FECHA_ADELANTO_MINUTOS,
  FECHA_MIN,
  GRASA_MAX,
  GRASA_MIN,
  LITROS_MAX,
  LITROS_MIN,
  OBSERVACIONES_MAX_LENGTH,
  SILO_MAX,
  SILO_MIN,
  TEMPERATURA_MAX,
  TEMPERATURA_MIN,
  TICKET_MAX,
  TICKET_MIN,
} from '../../models/limits';
import { getApiErrorField, getApiErrorMessage } from '../../utils/api-error';
import { ahoraEnPlanta } from '../../utils/periodos';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

/** fechaHora must be between FECHA_MIN and the plant's now + FECHA_ADELANTO_MINUTOS (YYYY-MM-DDTHH:mm strings compare in order). */
function fechaHoraEnRango(control: AbstractControl): ValidationErrors | null {
  const valor = typeof control.value === 'string' ? control.value.slice(0, 16) : '';
  if (!valor) {
    return null; // `required` reports the empty case
  }
  if (valor < FECHA_MIN) {
    return { fechaMin: true };
  }
  if (valor > ahoraEnPlanta(new Date(Date.now() + FECHA_ADELANTO_MINUTOS * 60_000))) {
    return { fechaMax: true };
  }
  return null;
}

@Component({
  selector: 'app-recepcion-form',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './recepcion-form.html',
  styleUrl: './recepcion-form.css',
})
export class RecepcionForm {
  private proveedoresService = inject(ProveedoresService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  proveedorId = input.required<string>();
  registrada = output<void>();

  readonly observacionesMaxLength = OBSERVACIONES_MAX_LENGTH;

  form = this.fb.group({
    fechaHora: [ahoraEnPlanta(), [Validators.required, fechaHoraEnRango]],
    litros: [
      null as number | null,
      [Validators.required, Validators.min(LITROS_MIN), Validators.max(LITROS_MAX)],
    ],
    grasa: [null as number | null, [Validators.min(GRASA_MIN), Validators.max(GRASA_MAX)]],
    acidez: [
      null as number | null,
      [Validators.required, Validators.min(ACIDEZ_MIN), Validators.max(ACIDEZ_MAX)],
    ],
    temperatura: [
      null as number | null,
      [Validators.required, Validators.min(TEMPERATURA_MIN), Validators.max(TEMPERATURA_MAX)],
    ],
    silo: [
      null as number | null,
      [Validators.min(SILO_MIN), Validators.max(SILO_MAX), Validators.pattern(/^\d+$/)],
    ],
    aguaPorcentaje: [
      null as number | null,
      [Validators.min(0), Validators.max(AGUA_MAX_PORCENTAJE)],
    ],
    ticket: [
      null as number | null,
      [Validators.min(TICKET_MIN), Validators.max(TICKET_MAX), Validators.pattern(/^\d+$/)],
    ],
    observaciones: ['', Validators.maxLength(OBSERVACIONES_MAX_LENGTH)],
  });

  saving = signal(false);
  saveError = signal<string | null>(null);

  invalid(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.touched && c.invalid;
  }

  submit(): void {
    // A second click can arrive before the disabled button is rendered
    if (this.saving()) {
      return;
    }
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
      aguaPorcentaje: v.aguaPorcentaje,
      ticket: v.ticket,
      observaciones: v.observaciones?.trim() || null,
    };

    this.saving.set(true);
    this.saveError.set(null);

    this.proveedoresService.registrarRecepcion(this.proveedorId(), recepcion).subscribe({
      next: () => {
        this.form.reset({ fechaHora: ahoraEnPlanta(), observaciones: '' });
        this.saving.set(false);
        this.snackBar.open('Recepción registrada.', 'Cerrar', { duration: 4000 });
        this.registrada.emit();
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = getApiErrorMessage(err, 'No se pudo registrar la recepción.');
        if (err.status === 409) {
          // Duplicate ticket: show it next to the ticket field (cleared when the user edits it)
          this.form.controls.ticket.setErrors({ duplicado: mensaje });
          this.form.controls.ticket.markAsTouched();
        } else if (this.mostrarEnCampo(getApiErrorField(err), mensaje)) {
          // Field-level 400 (e.g. fechaHora): shown next to the field
        } else {
          this.saveError.set(mensaje);
        }
        this.saving.set(false);
      },
    });
  }

  protected mensajeFechaHora(): string {
    const errores = this.form.controls.fechaHora.errors;
    if (errores?.['servidor']) {
      return errores['servidor'];
    }
    if (errores?.['fechaMin']) {
      return 'No puede ser anterior al 01/01/2000.';
    }
    if (errores?.['fechaMax']) {
      return 'No puede superar la hora actual en más de 1 hora.';
    }
    return 'Requerido.';
  }

  /** Puts an API message on the control it names (cleared when the user edits it); false if there is none. */
  private mostrarEnCampo(campo: string | null, mensaje: string): boolean {
    // Only fechaHora renders the server's text next to the field; any other field goes to the generic error.
    const control = campo === 'fechaHora' ? this.form.controls.fechaHora : null;
    if (!control) {
      return false;
    }
    control.setErrors({ servidor: mensaje });
    control.markAsTouched();
    return true;
  }
}
