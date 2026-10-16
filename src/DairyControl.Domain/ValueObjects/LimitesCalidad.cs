using DairyControl.Domain.Exceptions;
using DairyControl.Domain.Rules;
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

        // The limits a plant starts with (and the demo reset restores): 19 °D, 20 °C, 0 % water.
        public static LimitesCalidad Predeterminados { get; } = Create(19m, 20m, 0m);

        public decimal AcidezMaxima { get; }
        public decimal TemperaturaMaxima { get; }
        public decimal AguaMaxima { get; }

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
                throw new ReglaDeNegocioException($"La acidez máxima debe estar entre {AcidezMinimaPermitida} y {AcidezMaximaPermitida} °D.", nameof(acidezMaxima));
            }

            if (temperaturaMaxima < TemperaturaMinimaPermitida || temperaturaMaxima > TemperaturaMaximaPermitida)
            {
                throw new ReglaDeNegocioException($"La temperatura máxima debe estar entre {TemperaturaMinimaPermitida} y {TemperaturaMaximaPermitida} °C.", nameof(temperaturaMaxima));
            }

            if (aguaMaxima < AguaMinimaPermitida || aguaMaxima > AguaMaximaPermitida)
            {
                throw new ReglaDeNegocioException($"El agua máxima debe estar entre {AguaMinimaPermitida} y {AguaMaximaPermitida} %.", nameof(aguaMaxima));
            }

            return new LimitesCalidad(acidezMaxima, temperaturaMaxima, aguaMaxima);
        }

        // The single definition of "out of range": acidity above its maximum OR temperature above its maximum
        // OR water above its maximum. Fat has no limit. The rule is built from the three per-reason expressions
        // below, so a list can show why a recepción is out of range without repeating the thresholds. They are
        // expressions so EF Core can translate them to SQL.
        public Expression<Func<T, bool>> FueraDeRango<T>(
            Expression<Func<T, decimal>> acidez,
            Expression<Func<T, decimal>> temperatura,
            Expression<Func<T, decimal>> agua)
        {
            var parametro = Expression.Parameter(typeof(T), "x");
            var cuerpo = Expression.OrElse(
                Expression.OrElse(
                    Mayor(acidez, AcidezMaxima, parametro),
                    Mayor(temperatura, TemperaturaMaxima, parametro)),
                Mayor(agua, AguaMaxima, parametro));

            return Expression.Lambda<Func<T, bool>>(cuerpo, parametro);
        }

        public Expression<Func<T, bool>> AcidezAlta<T>(Expression<Func<T, decimal>> acidez)
            => MayorQue(acidez, AcidezMaxima);

        public Expression<Func<T, bool>> TemperaturaAlta<T>(Expression<Func<T, decimal>> temperatura)
            => MayorQue(temperatura, TemperaturaMaxima);

        public Expression<Func<T, bool>> AguaAlta<T>(Expression<Func<T, decimal>> agua)
            => MayorQue(agua, AguaMaxima);

        private static Expression<Func<T, bool>> MayorQue<T>(Expression<Func<T, decimal>> valor, decimal maximo)
        {
            var parametro = Expression.Parameter(typeof(T), "x");
            return Expression.Lambda<Func<T, bool>>(Mayor(valor, maximo, parametro), parametro);
        }

        private static BinaryExpression Mayor<T>(Expression<Func<T, decimal>> valor, decimal maximo, ParameterExpression parametro)
        {
            var cuerpo = new ReemplazarParametro(valor.Parameters[0], parametro).Visit(valor.Body);
            return Expression.GreaterThan(cuerpo, Expression.Constant(maximo));
        }

        public bool EstaFueraDeRango(decimal acidez, decimal temperatura, decimal agua)
        {
            var regla = FueraDeRango<(decimal Acidez, decimal Temperatura, decimal Agua)>(x => x.Acidez, x => x.Temperatura, x => x.Agua).Compile();
            return regla((acidez, temperatura, agua));
        }
    }
}
