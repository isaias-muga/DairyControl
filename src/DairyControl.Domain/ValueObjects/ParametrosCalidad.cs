namespace DairyControl.Domain.ValueObjects
{
    public record ParametrosCalidad
    {

        public const int Precision = 5;
        public const int Scale = 2;
        private static readonly decimal MaxValue = (decimal)Math.Pow(10, Precision - Scale);
        public decimal Grasa { get; init; }
        public decimal Acidez { get; init; }
        public decimal Temperatura { get; init; }

        private ParametrosCalidad(decimal grasa, decimal acidez, decimal temperatura)
        {
            Grasa = grasa;
            Acidez = acidez;
            Temperatura = temperatura;
        }
        public static ParametrosCalidad Create(decimal grasa, decimal acidez, decimal temperatura)
        {
            if (grasa < 0 || acidez < 0 || temperatura < 0)
            {
                throw new ArgumentException("Los parámetros de calidad no pueden ser negativos.");
            }

            if (grasa >= MaxValue || acidez >= MaxValue || temperatura >= MaxValue)
            {
                throw new ArgumentException("Los parámetros de calidad no pueden exceder el valor máximo permitido.");
            }

            return new ParametrosCalidad(grasa, acidez, temperatura);
        }
    }
}
