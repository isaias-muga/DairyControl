export interface Proveedor {
  id: string;
  nombre: string;
  cantidadRecepciones: number;
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
