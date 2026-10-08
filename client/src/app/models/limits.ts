// Mirrors the domain constants in DairyControl.Domain. The API is the authority;
// these exist only to give the user immediate feedback.

export const NOMBRE_MAX_LENGTH = 200; // Proveedor.NombreMaxLength
export const OBSERVACIONES_MAX_LENGTH = 500; // RecepcionLeche.ObservacionesMaxLength
export const PARAMETRO_MAX_EXCLUSIVE = 1000; // ParametrosCalidad.MaxValue (precision 5, scale 2)
export const LITROS_MIN = 0.1; // ParametrosCalidad minimum volume
export const LITROS_MAX_EXCLUSIVE = 100000; // ParametrosCalidad.MaxValueLitros (precision 8, scale 3)
