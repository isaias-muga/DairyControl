export interface TotalesResumen {
  litros: number;
  cantidadRecepciones: number;
  litrosPromedioPorRecepcion: number;
  temperaturaPromedio: number;
  temperaturaMinima: number;
  temperaturaMaxima: number;
  acidezPromedio: number;
  acidezMinima: number;
  acidezMaxima: number;
  grasaPromedio: number | null;
  cantidadConGrasa: number;
  cantidadFueraDeRango: number;
  litrosPeriodoAnterior: number;
}

export interface ResumenProveedor {
  proveedorId: string;
  nombre: string;
  litros: number;
  cantidadRecepciones: number;
  acidezPromedio: number;
  cantidadFueraDeRango: number;
}

export interface ResumenDia {
  fecha: string; // YYYY-MM-DD
  litros: number;
  cantidadRecepciones: number;
}

export interface ResumenRecepciones {
  desde: string;
  hasta: string;
  desdeAnterior: string;
  hastaAnterior: string;
  totales: TotalesResumen;
  proveedores: ResumenProveedor[];
  dias: ResumenDia[];
}
