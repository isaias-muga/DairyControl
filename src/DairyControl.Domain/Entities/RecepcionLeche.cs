using DairyControl.Domain.ValueObjects;
namespace DairyControl.Domain.Entities
{
    public class RecepcionLeche
    {
        public const int ObservacionesMaxLength = 500;
        public const int SiloMin = 1; // plausible silo numbers (a typing-error check, not a quality limit)
        public const int SiloMax = 20;
        public ParametrosCalidad Parametros { get; private set; } = null!;
        public Guid Id { get; private set; }
        public DateTime FechaHora { get; private set; }
        public int? Silo { get; private set; }
        public string? Observaciones { get; private set; }
        public int? Ticket { get; private set; }

        // Liters to pay: the added water is deducted (water null = 0).
        public decimal LitrosAPagar =>
            Math.Round(Parametros.Litros * (1 - (Parametros.AguaPorcentaje ?? 0) / 100m), ParametrosCalidad.ScaleLitros);

        private RecepcionLeche() { }

        public static RecepcionLeche Registrar(ParametrosCalidad parametros, DateTime fechaHora, int? silo, string? observaciones, int? ticket = null)
        {
            if (ticket != null && ticket < 1)
            {
                throw new ArgumentException("El número de ticket debe ser un entero positivo.", nameof(ticket));
            }
            if (silo != null && (silo < SiloMin || silo > SiloMax))
            {
                throw new ArgumentException($"El silo debe estar entre {SiloMin} y {SiloMax}.", nameof(silo));
            }
            var observacionesTrim = observaciones?.Trim();
            if (observacionesTrim?.Length == 0)
            {
                observacionesTrim = null; // blank text counts as no observaciones
            }
            if (observacionesTrim != null && observacionesTrim.Length > ObservacionesMaxLength)
            {
                throw new ArgumentException($"Las observaciones no pueden superar los {ObservacionesMaxLength} caracteres.");
            }
            return new RecepcionLeche
            {
                Id = Guid.NewGuid(),
                FechaHora = fechaHora,
                Silo = silo,
                Observaciones = observacionesTrim,
                Ticket = ticket,
                Parametros = parametros
            };
        }

    }
}
