import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ProveedoresService } from '../../services/proveedores';
import { Proveedor } from '../../models/proveedor';
import { NOMBRE_MAX_LENGTH } from '../../models/limits';
import { getApiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-proveedores-list',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './proveedores-list.html',
  styleUrl: './proveedores-list.css',
})
export class ProveedoresList {
  private proveedoresService = inject(ProveedoresService);
  private fb = inject(FormBuilder);

  readonly nombreMaxLength = NOMBRE_MAX_LENGTH;

  proveedores = signal<Proveedor[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(NOMBRE_MAX_LENGTH)],
    ],
  });
  saving = signal(false);
  saveError = signal<string | null>(null);

  constructor() {
    this.proveedoresService.getAll().subscribe({
      next: (data) => {
        this.proveedores.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los proveedores.');
        this.loading.set(false);
      },
    });
  }

  crear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    this.proveedoresService.create(this.form.getRawValue().nombre).subscribe({
      next: (creado) => {
        this.proveedores.update((lista) => [...lista, creado]);
        this.form.reset();
        this.saving.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.saveError.set(getApiErrorMessage(err, 'No se pudo crear el proveedor.'));
        this.saving.set(false);
      },
    });
  }
}
