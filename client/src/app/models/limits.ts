// Mirrors the domain constants in DairyControl.Domain. The API is the authority;
// these exist only to give the user immediate feedback.

export const NOMBRE_MAX_LENGTH = 200; // Proveedor.NombreMaxLength
export const OBSERVACIONES_MAX_LENGTH = 500; // RecepcionLeche.ObservacionesMaxLength
// Plausible ranges (typing errors, not the quality limits below). Litros must also be > 0.
export const LITROS_MAX = 30000; // ParametrosCalidad.LitrosMax
export const GRASA_MIN = 1; // ParametrosCalidad.GrasaMin
export const GRASA_MAX = 10; // ParametrosCalidad.GrasaMax
export const ACIDEZ_MIN = 10; // ParametrosCalidad.AcidezMin
export const ACIDEZ_MAX = 30; // ParametrosCalidad.AcidezMax
export const TEMPERATURA_MIN = 0; // ParametrosCalidad.TemperaturaMin
export const TEMPERATURA_MAX = 45; // ParametrosCalidad.TemperaturaMax
export const SILO_MIN = 1; // RecepcionLeche.SiloMin
export const SILO_MAX = 20; // RecepcionLeche.SiloMax
export const RESUMEN_MAX_DIAS = 366; // ResumenRecepcionesAppService.MaxDias
export const AGUA_MAX_PORCENTAJE = 100; // ParametrosCalidad.AguaMaxPorcentaje
export const TICKET_MIN = 1; // RecepcionLeche ticket must be a positive integer
export const ACIDEZ_LIMITE_MIN = 10; // LimitesCalidad.AcidezMinimaPermitida
export const ACIDEZ_LIMITE_MAX = 30; // LimitesCalidad.AcidezMaximaPermitida
export const TEMPERATURA_LIMITE_MIN = 0; // LimitesCalidad.TemperaturaMinimaPermitida
export const TEMPERATURA_LIMITE_MAX = 40; // LimitesCalidad.TemperaturaMaximaPermitida
export const AGUA_LIMITE_MIN = 0; // LimitesCalidad.AguaMinimaPermitida
export const AGUA_LIMITE_MAX = 10; // LimitesCalidad.AguaMaximaPermitida
