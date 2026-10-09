import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ProveedoresService } from '../../services/proveedores';
import { Proveedor } from '../../models/proveedor';
import { NOMBRE_MAX_LENGTH } from '../../models/limits';
import { getApiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-crear-proveedor-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './crear-proveedor-dialog.html',
  styleUrl: './crear-proveedor-dialog.css',
})
export class CrearProveedorDialog {
  private proveedoresService = inject(ProveedoresService);
  private fb = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<CrearProveedorDialog, Proveedor>>(MatDialogRef);

  readonly nombreMaxLength = NOMBRE_MAX_LENGTH;

  form = this.fb.nonNullable.group({
    nombre: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(NOMBRE_MAX_LENGTH)],
    ],
  });
  saving = signal(false);
  saveError = signal<string | null>(null);

  crear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    this.proveedoresService.create(this.form.getRawValue().nombre).subscribe({
      next: (creado) => {
        this.saving.set(false);
        this.dialogRef.close(creado);
      },
      error: (err: HttpErrorResponse) => {
        this.saveError.set(getApiErrorMessage(err, 'No se pudo crear el proveedor.'));
        this.saving.set(false);
      },
    });
  }
}
