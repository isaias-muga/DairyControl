using DairyControl.Domain.ValueObjects;
namespace DairyControl.Domain.Entities
{
    public class RecepcionLeche
    {
        public const int ObservacionesMaxLength = 500;
        public ParametrosCalidad Parametros { get; private set; } = null!;
        public Guid Id { get; private set; }
        public DateTime FechaHora { get; private set; }
        public int? Silo { get; private set; }
        public string? Observaciones { get; private set; }
        private RecepcionLeche() { }

        public static RecepcionLeche Registrar(ParametrosCalidad parametros, DateTime fechaHora, int? silo, string? observaciones)
        {
            var observacionesTrim = observaciones?.Trim();
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
                Parametros = parametros
            };
        }

    }
}
