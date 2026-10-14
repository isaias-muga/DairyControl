export interface TotalesResumen {
  litros: number;
  cantidadRecepciones: number;
  temperaturaPromedio: number;
  acidezPromedio: number;
  grasaPromedio: number | null;
  cantidadAcidezAlta: number;
}

export interface ResumenProveedor {
  proveedorId: string;
  nombre: string;
  litros: number;
  cantidadRecepciones: number;
  acidezPromedio: number;
}

export interface ResumenDia {
  fecha: string; // YYYY-MM-DD
  litros: number;
  cantidadRecepciones: number;
}

export interface ResumenRecepciones {
  desde: string;
  hasta: string;
  totales: TotalesResumen;
  proveedores: ResumenProveedor[];
  dias: ResumenDia[];
}
