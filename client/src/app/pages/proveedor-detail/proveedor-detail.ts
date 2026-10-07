import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-proveedor-detail',
  styleUrl: './proveedor-detail.css',
  templateUrl: './proveedor-detail.html',
})
export class ProveedorDetail {
  readonly id = input<string>();
}
