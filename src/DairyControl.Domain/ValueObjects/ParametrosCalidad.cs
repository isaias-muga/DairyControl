namespace DairyControl.Domain.ValueObjects
{
    public record ParametrosCalidad
    {

        public const int Precision = 5;
        public const int Scale = 2;
        public const int ScaleLitros = 3;
        public const int PrecisionLitros = 8;

        // Plausible ranges (inclusive): they reject typing errors. They are NOT the quality limits
        // (LimitesCalidad): a value outside those limits is accepted and flagged as out of range.
        public const decimal LitrosMax = 30000m; // litros must be > 0 and <= LitrosMax
        public const decimal GrasaMin = 1m;
        public const decimal GrasaMax = 10m;
        public const decimal AcidezMin = 10m;
        public const decimal AcidezMax = 30m;
        public const decimal TemperaturaMin = 0m;
        public const decimal TemperaturaMax = 45m;
        public const decimal AguaMinPorcentaje = 0m;
        public const decimal AguaMaxPorcentaje = 100m;

        public decimal? Grasa { get; init; }
        public decimal Acidez { get; init; }
        public decimal Temperatura { get; init; }
        public decimal Litros { get; init; }
        public decimal? AguaPorcentaje { get; init; }

        private ParametrosCalidad(decimal? grasa, decimal acidez, decimal temperatura, decimal litros, decimal? aguaPorcentaje)
        {
            Grasa = grasa;
            Acidez = acidez;
            Temperatura = temperatura;
            Litros = litros;
            AguaPorcentaje = aguaPorcentaje;
        }
        public static ParametrosCalidad Create(decimal? grasa, decimal acidez, decimal temperatura, decimal litros, decimal? aguaPorcentaje = null)
        {
            if (litros <= 0 || litros > LitrosMax)
            {
                throw new ArgumentException($"Los litros deben ser mayores que 0 y no superar {LitrosMax:0}.", nameof(litros));
            }

            if (grasa != null && (grasa < GrasaMin || grasa > GrasaMax))
            {
                throw new ArgumentException($"La grasa debe estar entre {GrasaMin:0} y {GrasaMax:0} %.", nameof(grasa));
            }

            if (acidez < AcidezMin || acidez > AcidezMax)
            {
                throw new ArgumentException($"La acidez debe estar entre {AcidezMin:0} y {AcidezMax:0} °D.", nameof(acidez));
            }

            if (temperatura < TemperaturaMin || temperatura > TemperaturaMax)
            {
                throw new ArgumentException($"La temperatura debe estar entre {TemperaturaMin:0} y {TemperaturaMax:0} °C.", nameof(temperatura));
            }

            if (aguaPorcentaje != null && (aguaPorcentaje < AguaMinPorcentaje || aguaPorcentaje > AguaMaxPorcentaje))
            {
                throw new ArgumentException($"El porcentaje de agua debe estar entre {AguaMinPorcentaje:0} y {AguaMaxPorcentaje:0}.", nameof(aguaPorcentaje));
            }

            return new ParametrosCalidad(grasa, acidez, temperatura, litros, aguaPorcentaje);
        }
    }
}
