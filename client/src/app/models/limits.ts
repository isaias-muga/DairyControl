// Mirrors the domain constants in DairyControl.Domain. The API is the authority;
// these exist only to give the user immediate feedback.

export const NOMBRE_MAX_LENGTH = 200; // Proveedor.NombreMaxLength
export const OBSERVACIONES_MAX_LENGTH = 500; // RecepcionLeche.ObservacionesMaxLength
export const PARAMETRO_MAX_EXCLUSIVE = 1000; // ParametrosCalidad.MaxValue (precision 5, scale 2)
export const LITROS_MIN = 0.1; // ParametrosCalidad minimum volume
export const LITROS_MAX_EXCLUSIVE = 100000; // ParametrosCalidad.MaxValueLitros (precision 8, scale 3)
export const RESUMEN_MAX_DIAS = 366; // ResumenRecepcionesAppService.MaxDias
export const AGUA_MAX_PORCENTAJE = 100; // ParametrosCalidad.AguaMaxPorcentaje
export const TICKET_MIN = 1; // RecepcionLeche ticket must be a positive integer
export const ACIDEZ_LIMITE_MIN = 10; // LimitesCalidad.AcidezMinimaPermitida
export const ACIDEZ_LIMITE_MAX = 30; // LimitesCalidad.AcidezMaximaPermitida
export const TEMPERATURA_LIMITE_MIN = 0; // LimitesCalidad.TemperaturaMinimaPermitida
export const TEMPERATURA_LIMITE_MAX = 40; // LimitesCalidad.TemperaturaMaximaPermitida
export const AGUA_LIMITE_MIN = 0; // LimitesCalidad.AguaMinimaPermitida
export const AGUA_LIMITE_MAX = 10; // LimitesCalidad.AguaMaximaPermitida
