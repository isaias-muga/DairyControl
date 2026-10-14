using System.Linq.Expressions;

namespace DairyControl.Domain.ValueObjects
{
    public record LimitesCalidad
    {
        public decimal AcidezMaxima { get; init; }
        public decimal TemperaturaMaxima { get; init; }

        private LimitesCalidad(decimal acidezMaxima, decimal temperaturaMaxima)
        {
            AcidezMaxima = acidezMaxima;
            TemperaturaMaxima = temperaturaMaxima;
        }

        public static LimitesCalidad Create(decimal acidezMaxima, decimal temperaturaMaxima)
        {
            if (acidezMaxima <= 0)
            {
                throw new ArgumentException("La acidez máxima debe ser mayor que cero.", nameof(acidezMaxima));
            }

            if (temperaturaMaxima <= 0)
            {
                throw new ArgumentException("La temperatura máxima debe ser mayor que cero.", nameof(temperaturaMaxima));
            }

            return new LimitesCalidad(acidezMaxima, temperaturaMaxima);
        }

        // The single definition of "out of range": acidity above its maximum OR temperature above its maximum.
        // Fat has no limit. It is an expression so EF Core can translate it to SQL.
        public Expression<Func<T, bool>> FueraDeRango<T>(
            Expression<Func<T, decimal>> acidez,
            Expression<Func<T, decimal>> temperatura)
        {
            var parametro = Expression.Parameter(typeof(T), "x");
            var acidezCuerpo = new ReemplazarParametro(acidez.Parameters[0], parametro).Visit(acidez.Body);
            var temperaturaCuerpo = new ReemplazarParametro(temperatura.Parameters[0], parametro).Visit(temperatura.Body);

            var cuerpo = Expression.OrElse(
                Expression.GreaterThan(acidezCuerpo, Expression.Constant(AcidezMaxima)),
                Expression.GreaterThan(temperaturaCuerpo, Expression.Constant(TemperaturaMaxima)));

            return Expression.Lambda<Func<T, bool>>(cuerpo, parametro);
        }

        public bool EstaFueraDeRango(decimal acidez, decimal temperatura)
        {
            var regla = FueraDeRango<(decimal Acidez, decimal Temperatura)>(x => x.Acidez, x => x.Temperatura).Compile();
            return regla((acidez, temperatura));
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
