using System.Linq.Expressions;

namespace SpecificationPattern;

public class AndSpecification<T> : Specification<T>
{
    private readonly Specification<T> _left;
    private readonly Specification<T> _right;

    public AndSpecification(Specification<T> left, Specification<T> right)
    {
        _left = left;
        _right = right;
    }

    public override Expression<Func<T, bool>> ToExpression()
    {
        Expression<Func<T, bool>> left = _left.ToExpression();
        Expression<Func<T, bool>> right = _right.ToExpression();

        // One shared parameter for both sides.
        ParameterExpression parameter = Expression.Parameter(typeof(T));

        Expression leftBody = new ReplaceParameterVisitor(left.Parameters[0], parameter).Visit(left.Body);
        Expression rightBody = new ReplaceParameterVisitor(right.Parameters[0], parameter).Visit(right.Body);

        Expression body = Expression.AndAlso(leftBody, rightBody);
        return Expression.Lambda<Func<T, bool>>(body, parameter);
    }
}
