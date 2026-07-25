using System.Linq.Expressions;

namespace SpecificationPattern;

public class OrSpecification<T> : Specification<T>
{
    private readonly Specification<T> _left;
    private readonly Specification<T> _right;

    public OrSpecification(Specification<T> left, Specification<T> right)
    {
        _left = left;
        _right = right;
    }

    public override Expression<Func<T, bool>> ToExpression()
    {
        Expression<Func<T, bool>> left = _left.ToExpression();
        Expression<Func<T, bool>> right = _right.ToExpression();

        ParameterExpression parameter = Expression.Parameter(typeof(T));

        Expression leftBody = new ReplaceParameterVisitor(left.Parameters[0], parameter).Visit(left.Body);
        Expression rightBody = new ReplaceParameterVisitor(right.Parameters[0], parameter).Visit(right.Body);

        Expression body = Expression.OrElse(leftBody, rightBody);
        return Expression.Lambda<Func<T, bool>>(body, parameter);
    }
}
