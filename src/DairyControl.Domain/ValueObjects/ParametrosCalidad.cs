namespace DairyControl.Domain.ValueObjects
{
    public record ParametrosCalidad
    {

        public const int Precision = 5;
        public const int Scale = 2;
        public const int ScaleLitros = 3;
        public const int PrecisionLitros = 8;
        private static readonly decimal MaxValue = (decimal)Math.Pow(10, Precision - Scale);

        private static readonly decimal MaxValueLitros = (decimal)Math.Pow(10, PrecisionLitros - ScaleLitros);
        public decimal? Grasa { get; init; }
        public decimal Acidez { get; init; }
        public decimal Temperatura { get; init; }
        public decimal Litros { get; init; }

        private ParametrosCalidad(decimal? grasa, decimal acidez, decimal temperatura, decimal litros)
        {
            Grasa = grasa;
            Acidez = acidez;
            Temperatura = temperatura;
            Litros = litros;
        }
        public static ParametrosCalidad Create(decimal? grasa, decimal acidez, decimal temperatura, decimal litros)
        {
            if ((grasa != null && grasa < 0) || acidez < 0 || temperatura < 0)
            {
                throw new ArgumentException("Los parámetros de calidad no pueden ser negativos.");
            }

            if ((grasa != null && grasa >= MaxValue) || acidez >= MaxValue || temperatura >= MaxValue)
            {
                throw new ArgumentException("Los parámetros de calidad no pueden exceder el valor máximo permitido.");
            }

            if (litros < 0.1m)
            {
                throw new ArgumentException("La cantidad de litros debe ser al menos 0.1.");
            }

            if (litros >= MaxValueLitros)
            {
                throw new ArgumentException("La cantidad de litros no puede exceder el valor máximo permitido.");
            }

            return new ParametrosCalidad(grasa, acidez, temperatura, litros);


        }
    }
}
