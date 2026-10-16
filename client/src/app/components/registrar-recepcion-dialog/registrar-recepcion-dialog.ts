import { Component, inject, signal, viewChild } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Observable, filter } from 'rxjs';
import { RecepcionForm } from '../recepcion-form/recepcion-form';

export interface RegistrarRecepcionDialogData {
  /** The proveedor of the recepción; without it the dialog lets the operator choose one. */
  proveedorId?: string | null;
}

@Component({
  selector: 'app-registrar-recepcion-dialog',
  imports: [RecepcionForm, MatDialogModule, MatButtonModule],
  templateUrl: './registrar-recepcion-dialog.html',
  styleUrl: './registrar-recepcion-dialog.css',
})
export class RegistrarRecepcionDialog {
  private dialogRef = inject<MatDialogRef<RegistrarRecepcionDialog, boolean>>(MatDialogRef);
  protected data = inject<RegistrarRecepcionDialogData>(MAT_DIALOG_DATA);

  /** True once at least one recepción was saved, even if the dialog stays open ("Registrar y cargar otra"). */
  protected registro = signal(false);
  private formulario = viewChild(RecepcionForm);

  constructor() {
    // The dialog is opened with disableClose so that closing it by any route (Cancelar, Esc, backdrop)
    // reports whether something was saved and the caller can refresh its list.
    this.dialogRef.backdropClick().subscribe(() => this.cerrar());
    this.dialogRef
      .keydownEvents()
      .pipe(filter((e) => e.key === 'Escape'))
      .subscribe(() => this.cerrar());
  }

  /**
   * Opens the dialog; the returned observable emits `true` when it closes after saving at least one recepción
   * (so the caller can reload its list) and `false` otherwise.
   */
  static abrir(dialog: MatDialog, data: RegistrarRecepcionDialogData): Observable<boolean | undefined> {
    return dialog
      .open<RegistrarRecepcionDialog, RegistrarRecepcionDialogData, boolean>(RegistrarRecepcionDialog, {
        data,
        width: '640px',
        maxWidth: '95vw',
        disableClose: true,
      })
      .afterClosed();
  }

  onRegistrada(cargarOtra: boolean): void {
    this.registro.set(true);
    if (!cargarOtra) {
      this.cerrar();
    }
  }

  protected cerrar(): void {
    // Closing while a save is in flight would report "nothing saved" before the answer arrives
    if (this.formulario()?.saving()) {
      return;
    }
    this.dialogRef.close(this.registro());
  }
}
