import { Component, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Proveedor } from '../../models/proveedor';
import { ProveedoresService } from '../../services/proveedores';

@Component({
  selector: 'app-proveedor-detail',
  imports: [RouterLink],
  templateUrl: './proveedor-detail.html',
  styleUrl: './proveedor-detail.css',
})
export class ProveedorDetail implements OnInit {
  private readonly service = inject(ProveedoresService);

  readonly id = input.required<string>();

  protected readonly proveedor = signal<Proveedor | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly error = signal(false);

  ngOnInit() {
    this.service.getById(this.id()).subscribe({
      next: (data) => {
        this.proveedor.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set(true);
        }
        this.loading.set(false);
      },
    });
  }
}
