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
  aguaPorcentaje: number | null;
  ticket: number | null;
  litrosAPagar: number;
}

export interface ProveedorDetalle {
  id: string;
  nombre: string;
  recepciones: Recepcion[];
}

export interface RegistrarRecepcion {
  fechaHora: string;
  litros: number;
  grasa: number | null;
  acidez: number;
  temperatura: number;
  silo: number | null;
  observaciones: string | null;
  aguaPorcentaje: number | null;
  ticket: number | null;
}
