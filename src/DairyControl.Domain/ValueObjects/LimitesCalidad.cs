using System.Linq.Expressions;

namespace DairyControl.Domain.ValueObjects
{
    public record LimitesCalidad
    {
        public const decimal AcidezMinimaPermitida = 10m;
        public const decimal AcidezMaximaPermitida = 30m;
        public const decimal TemperaturaMinimaPermitida = 0m;
        public const decimal TemperaturaMaximaPermitida = 40m;
        public const decimal AguaMinimaPermitida = 0m;
        public const decimal AguaMaximaPermitida = 10m;

        public decimal AcidezMaxima { get; init; }
        public decimal TemperaturaMaxima { get; init; }
        public decimal AguaMaxima { get; init; }

        private LimitesCalidad(decimal acidezMaxima, decimal temperaturaMaxima, decimal aguaMaxima)
        {
            AcidezMaxima = acidezMaxima;
            TemperaturaMaxima = temperaturaMaxima;
            AguaMaxima = aguaMaxima;
        }

        public static LimitesCalidad Create(decimal acidezMaxima, decimal temperaturaMaxima, decimal aguaMaxima)
        {
            if (acidezMaxima < AcidezMinimaPermitida || acidezMaxima > AcidezMaximaPermitida)
            {
                throw new ArgumentException($"La acidez máxima debe estar entre {AcidezMinimaPermitida} y {AcidezMaximaPermitida} °D.", nameof(acidezMaxima));
            }

            if (temperaturaMaxima < TemperaturaMinimaPermitida || temperaturaMaxima > TemperaturaMaximaPermitida)
            {
                throw new ArgumentException($"La temperatura máxima debe estar entre {TemperaturaMinimaPermitida} y {TemperaturaMaximaPermitida} °C.", nameof(temperaturaMaxima));
            }

            if (aguaMaxima < AguaMinimaPermitida || aguaMaxima > AguaMaximaPermitida)
            {
                throw new ArgumentException($"El agua máxima debe estar entre {AguaMinimaPermitida} y {AguaMaximaPermitida} %.", nameof(aguaMaxima));
            }

            return new LimitesCalidad(acidezMaxima, temperaturaMaxima, aguaMaxima);
        }

        // The single definition of "out of range": acidity above its maximum OR temperature above its maximum
        // OR water above its maximum. Fat has no limit. It is an expression so EF Core can translate it to SQL.
        public Expression<Func<T, bool>> FueraDeRango<T>(
            Expression<Func<T, decimal>> acidez,
            Expression<Func<T, decimal>> temperatura,
            Expression<Func<T, decimal>> agua)
        {
            var parametro = Expression.Parameter(typeof(T), "x");
            var acidezCuerpo = new ReemplazarParametro(acidez.Parameters[0], parametro).Visit(acidez.Body);
            var temperaturaCuerpo = new ReemplazarParametro(temperatura.Parameters[0], parametro).Visit(temperatura.Body);
            var aguaCuerpo = new ReemplazarParametro(agua.Parameters[0], parametro).Visit(agua.Body);

            var cuerpo = Expression.OrElse(
                Expression.OrElse(
                    Expression.GreaterThan(acidezCuerpo, Expression.Constant(AcidezMaxima)),
                    Expression.GreaterThan(temperaturaCuerpo, Expression.Constant(TemperaturaMaxima))),
                Expression.GreaterThan(aguaCuerpo, Expression.Constant(AguaMaxima)));

            return Expression.Lambda<Func<T, bool>>(cuerpo, parametro);
        }

        public bool EstaFueraDeRango(decimal acidez, decimal temperatura, decimal agua)
        {
            var regla = FueraDeRango<(decimal Acidez, decimal Temperatura, decimal Agua)>(x => x.Acidez, x => x.Temperatura, x => x.Agua).Compile();
            return regla((acidez, temperatura, agua));
        }

        private sealed class ReemplazarParametro : ExpressionVisitor
        {
            private readonly ParameterExpression _origen;
            private readonly ParameterExpression _destino;

            public ReemplazarParametro(ParameterExpression origen, ParameterExpression destino)
            {
                _origen = origen;
                _destino = destino;
            }

            protected override Expression VisitParameter(ParameterExpression node)
                => node == _origen ? _destino : base.VisitParameter(node);
        }
    }
}
