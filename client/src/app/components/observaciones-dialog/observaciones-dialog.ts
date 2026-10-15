import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ObservacionesDialogData {
  ticket: number | null;
  proveedor: string;
  fechaHora: string;
  observaciones: string;
}

@Component({
  selector: 'app-observaciones-dialog',
  imports: [DatePipe, MatDialogModule, MatButtonModule],
  templateUrl: './observaciones-dialog.html',
  styleUrl: './observaciones-dialog.css',
})
export class ObservacionesDialog {
  protected data = inject<ObservacionesDialogData>(MAT_DIALOG_DATA);
}
