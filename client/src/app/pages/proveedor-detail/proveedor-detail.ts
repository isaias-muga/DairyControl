import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProveedoresService } from '../../services/proveedores';
import { ProveedorDetalle } from '../../models/proveedor';
import { RecepcionForm } from '../../components/recepcion-form/recepcion-form';

@Component({
  selector: 'app-proveedor-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, RecepcionForm],
  templateUrl: './proveedor-detail.html',
  styleUrl: './proveedor-detail.css',
})
export class ProveedorDetail {
  private proveedoresService = inject(ProveedoresService);
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
