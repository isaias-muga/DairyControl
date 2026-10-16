import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

/** Asks whether to throw away what was typed. Closes with `true` only when the operator chooses "Descartar". */
@Component({
  selector: 'app-confirmar-descarte-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>¿Descartar la recepción sin guardar?</h2>
    <mat-dialog-content>Los datos cargados se van a perder.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" cdkFocusInitial [mat-dialog-close]="false">Seguir editando</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true">Descartar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmarDescarteDialog {}
