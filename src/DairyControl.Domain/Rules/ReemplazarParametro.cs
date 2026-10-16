using System.Linq.Expressions;

namespace DairyControl.Domain.Rules
{
    // Rewrites the parameter of an expression body, so several expressions can be combined into one that EF Core translates.
    internal sealed class ReemplazarParametro : ExpressionVisitor
    {
        private readonly ParameterExpression _origen;
        private readonly Expression _destino;

        public ReemplazarParametro(ParameterExpression origen, Expression destino)
        {
            _origen = origen;
            _destino = destino;
        }

        protected override Expression VisitParameter(ParameterExpression node)
            => node == _origen ? _destino : base.VisitParameter(node);
    }
}
