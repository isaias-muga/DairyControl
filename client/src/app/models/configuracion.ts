export interface LimitesCalidad {
  acidezMaxima: number;
  temperaturaMaxima: number;
  aguaMaxima: number;
  actualizadoEn: string;
  /** Opaque version of these limits: the update sends it back so the API can reject a stale edit (409). */
  version: string;
}

export interface ActualizarLimitesCalidad {
  acidezMaxima: number;
  temperaturaMaxima: number;
  aguaMaxima: number;
  version: string;
}
