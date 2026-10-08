export interface Proveedor {
  id: string;
  nombre: string;
  cantidadRecepciones: number;
}

export interface Recepcion {
  id: string;
  fechaHora: string;
  litros: number;
  grasa: number | null;
  acidez: number;
  temperatura: number;
  silo: number | null;
  observaciones: string | null;
}

export interface ProveedorDetalle {
  id: string;
  nombre: string;
  recepciones: Recepcion[];
}
