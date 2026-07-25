using System.Linq.Expressions;

namespace SpecificationPattern;

public class NotSpecification<T> : Specification<T>
{
    private readonly Specification<T> _inner;
    public NotSpecification(Specification<T> inner) => _inner = inner;

    public override Expression<Func<T, bool>> ToExpression()
    {
        Expression<Func<T, bool>> expression = _inner.ToExpression();
        Expression body = Expression.Not(expression.Body);
        return Expression.Lambda<Func<T, bool>>(body, expression.Parameters);
    }
}
