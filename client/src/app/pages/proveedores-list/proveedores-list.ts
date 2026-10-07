import { Component, signal, inject } from '@angular/core';
import { Proveedor } from '../../models/proveedor';
import { RouterLink } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ProveedoresService } from '../../services/proveedores';

@Component({
  imports: [RouterLink],
  selector: 'app-proveedores-list',
  styleUrl: './proveedores-list.css',
  templateUrl: './proveedores-list.html',
})
export class ProveedoresList {
  private readonly service = inject(ProveedoresService);

  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  constructor() {
    this.service.getAll().subscribe({
      next: (data) => {
        this.proveedores.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
provideHttpClient();
