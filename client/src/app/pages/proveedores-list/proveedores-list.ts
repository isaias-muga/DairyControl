import { Component, signal } from '@angular/core';
import { Proveedor } from '../../models/proveedor';
import { RouterLink } from '@angular/router';
@Component({
  imports: [RouterLink],
  selector: 'app-proveedores-list',
  styleUrl: './proveedores-list.css',
  templateUrl: './proveedores-list.html',
})
export class ProveedoresList {
  protected readonly proveedores = signal<Proveedor[]>([
    { id: '1', nombre: 'Tambo 1', cantidadRecepciones: 3 },
    { id: '2', nombre: 'Mansilla', cantidadRecepciones: 5 },
    { id: '3', nombre: 'Bosch', cantidadRecepciones: 0 },
  ]);
}
