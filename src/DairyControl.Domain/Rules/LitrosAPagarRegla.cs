using System.Linq.Expressions;
using DairyControl.Domain.Entities;

namespace DairyControl.Domain.Rules
{
    // The single definition of "litros a pagar": liters minus the added water (water null = 0), not rounded.
    // It is an expression so EF Core can translate it to SQL: a query writes De(recepcion) inside its projection
    // and passes the whole projection through Expandir, which swaps the call for the formula. The entity runs the
    // same expression compiled (once). Callers round to ParametrosCalidad.ScaleLitros.
    public static class LitrosAPagarRegla
    {
        private static readonly Expression<Func<RecepcionLeche, decimal>> Formula =
            Expresion<RecepcionLeche>(r => r.Parametros.Litros, r => r.Parametros.AguaPorcentaje);

        private static readonly Func<RecepcionLeche, decimal> Compilada = Formula.Compile();

        public static Expression<Func<T, decimal>> Expresion<T>(
            Expression<Func<T, decimal>> litros,
            Expression<Func<T, decimal?>> aguaPorcentaje)
        {
            var parametro = Expression.Parameter(typeof(T), "x");
            var litrosCuerpo = new ReemplazarParametro(litros.Parameters[0], parametro).Visit(litros.Body);
            var aguaCuerpo = new ReemplazarParametro(aguaPorcentaje.Parameters[0], parametro).Visit(aguaPorcentaje.Body);

            var agua = Expression.Coalesce(aguaCuerpo, Expression.Constant(0m));
            var factor = Expression.Subtract(
                Expression.Constant(1m),
                Expression.Divide(agua, Expression.Constant(100m)));

            return Expression.Lambda<Func<T, decimal>>(Expression.Multiply(litrosCuerpo, factor), parametro);
        }

        // The value for one recepción (not rounded). In a query, only valid inside an expression passed to Expandir.
        public static decimal De(RecepcionLeche recepcion) => Compilada(recepcion);

        // Replaces every De(x) in the expression with the formula applied to x, so EF Core can translate it.
        public static Expression<TDelegate> Expandir<TDelegate>(Expression<TDelegate> consulta)
        {
            ArgumentNullException.ThrowIfNull(consulta);
            return (Expression<TDelegate>)new ExpansorDeFormula().Visit(consulta);
        }

        private sealed class ExpansorDeFormula : ExpressionVisitor
        {
            protected override Expression VisitMethodCall(MethodCallExpression node)
            {
                if (node.Method.DeclaringType == typeof(LitrosAPagarRegla) && node.Method.Name == nameof(De))
                {
                    var argumento = Visit(node.Arguments[0]);
                    return new ReemplazarParametro(Formula.Parameters[0], argumento).Visit(Formula.Body);
                }
                return base.VisitMethodCall(node);
            }
        }
    }
}
