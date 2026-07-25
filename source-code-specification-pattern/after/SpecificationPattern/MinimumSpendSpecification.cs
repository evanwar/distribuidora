using System.Linq.Expressions;

namespace SpecificationPattern;

public class MinimumSpendSpecification : Specification<Customer>
{
    private readonly decimal _minimum;
    public MinimumSpendSpecification(decimal minimum) => _minimum = minimum;

    public override Expression<Func<Customer, bool>> ToExpression()
        => customer => customer.TotalSpent >= _minimum;
}
