import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { RecepcionForm } from '../recepcion-form/recepcion-form';

export interface RegistrarRecepcionDialogData {
  proveedorId: string;
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

  onRegistrada(): void {
    this.dialogRef.close(true);
  }
}
