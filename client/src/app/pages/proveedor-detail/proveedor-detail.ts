import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProveedoresService } from '../../services/proveedores';
import { ProveedorDetalle, Recepcion } from '../../models/proveedor';
import {
  RegistrarRecepcionDialog,
  RegistrarRecepcionDialogData,
} from '../../components/registrar-recepcion-dialog/registrar-recepcion-dialog';
import { ObservacionCelda } from '../../components/observacion-celda/observacion-celda';
import {
  ObservacionesDialog,
  ObservacionesDialogData,
} from '../../components/observaciones-dialog/observaciones-dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-proveedor-detail',
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    ObservacionCelda,
  ],
  templateUrl: './proveedor-detail.html',
  styleUrl: './proveedor-detail.css',
})
export class ProveedorDetail {
  private proveedoresService = inject(ProveedoresService);
  private dialog = inject(MatDialog);
  private request?: Subscription;

  id = input.required<string>();

  proveedor = signal<ProveedorDetalle | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  notFound = signal(false);

  constructor() {
    effect(() => {
      this.id(); // re-run whenever the route id changes
      untracked(() => this.load());
    });
  }

  protected verObservaciones(recepcion: Recepcion, proveedor: ProveedorDetalle): void {
    this.dialog.open<ObservacionesDialog, ObservacionesDialogData>(ObservacionesDialog, {
      data: {
        ticket: recepcion.ticket,
        proveedor: proveedor.nombre,
        fechaHora: recepcion.fechaHora,
        observaciones: recepcion.observaciones ?? '',
      },
      width: '480px',
      maxWidth: '95vw',
    });
  }

  protected abrirRegistro(proveedorId: string): void {
    this.dialog
      .open<RegistrarRecepcionDialog, RegistrarRecepcionDialogData, boolean>(
        RegistrarRecepcionDialog,
        { data: { proveedorId }, width: '640px', maxWidth: '95vw' },
      )
      .afterClosed()
      .subscribe((registrada) => {
        if (registrada) {
          this.load(false);
        }
      });
  }

  protected load(showSpinner = true): void {
    this.request?.unsubscribe();

    if (showSpinner) {
      this.loading.set(true);
    }
    this.error.set(null);
    this.notFound.set(false);

    this.request = this.proveedoresService.getById(this.id()).subscribe({
      next: (data) => {
        this.proveedor.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('No se pudo cargar el proveedor.');
        }
        this.loading.set(false);
      },
    });
  }
}
