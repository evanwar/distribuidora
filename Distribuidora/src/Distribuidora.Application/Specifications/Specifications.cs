using System.Linq.Expressions;

namespace Distribuidora.Application.Specifications;

public abstract class Specification<TEntity> where TEntity : class
{
    public abstract Expression<Func<TEntity, bool>> ToExpression();

    public bool IsSatisfiedBy(TEntity candidate) =>
        ToExpression().Compile()(candidate);

    public Specification<TEntity> And(Specification<TEntity> other) =>
        new AndSpecification<TEntity>(this, other);

    public Specification<TEntity> Or(Specification<TEntity> other) =>
        new OrSpecification<TEntity>(this, other);

    public Specification<TEntity> Not() =>
        new NotSpecification<TEntity>(this);

    public static implicit operator Expression<Func<TEntity, bool>>(
        Specification<TEntity> specification) =>
        specification.ToExpression();
}

public sealed class ExpressionSpecification<TEntity>(
    Expression<Func<TEntity, bool>> expression) : Specification<TEntity>
    where TEntity : class
{
    public override Expression<Func<TEntity, bool>> ToExpression() => expression;
}

public sealed class AllSpecification<TEntity> : Specification<TEntity>
    where TEntity : class
{
    public override Expression<Func<TEntity, bool>> ToExpression() => _ => true;
}

public sealed class AndSpecification<TEntity>(
    Specification<TEntity> left,
    Specification<TEntity> right) : Specification<TEntity>
    where TEntity : class
{
    public override Expression<Func<TEntity, bool>> ToExpression() =>
        SpecificationExpressionComposer.Compose(
            left.ToExpression(),
            right.ToExpression(),
            Expression.AndAlso);
}

public sealed class OrSpecification<TEntity>(
    Specification<TEntity> left,
    Specification<TEntity> right) : Specification<TEntity>
    where TEntity : class
{
    public override Expression<Func<TEntity, bool>> ToExpression() =>
        SpecificationExpressionComposer.Compose(
            left.ToExpression(),
            right.ToExpression(),
            Expression.OrElse);
}

public sealed class NotSpecification<TEntity>(
    Specification<TEntity> inner) : Specification<TEntity>
    where TEntity : class
{
    public override Expression<Func<TEntity, bool>> ToExpression()
    {
        var expression = inner.ToExpression();
        return Expression.Lambda<Func<TEntity, bool>>(
            Expression.Not(expression.Body),
            expression.Parameters);
    }
}

public static class Specification
{
    public static Specification<TEntity> Create<TEntity>(
        Expression<Func<TEntity, bool>> expression)
        where TEntity : class =>
        new ExpressionSpecification<TEntity>(expression);

    public static Specification<TEntity> All<TEntity>()
        where TEntity : class =>
        new AllSpecification<TEntity>();
}

internal static class SpecificationExpressionComposer
{
    public static Expression<Func<TEntity, bool>> Compose<TEntity>(
        Expression<Func<TEntity, bool>> left,
        Expression<Func<TEntity, bool>> right,
        Func<Expression, Expression, BinaryExpression> merge)
    {
        var parameter = Expression.Parameter(typeof(TEntity), "entity");
        var leftBody = new ReplaceParameterVisitor(left.Parameters[0], parameter).Visit(left.Body)!;
        var rightBody = new ReplaceParameterVisitor(right.Parameters[0], parameter).Visit(right.Body)!;
        return Expression.Lambda<Func<TEntity, bool>>(merge(leftBody, rightBody), parameter);
    }
}

internal sealed class ReplaceParameterVisitor(
    ParameterExpression oldParameter,
    ParameterExpression newParameter) : ExpressionVisitor
{
    protected override Expression VisitParameter(ParameterExpression node) =>
        node == oldParameter ? newParameter : base.VisitParameter(node);
}
