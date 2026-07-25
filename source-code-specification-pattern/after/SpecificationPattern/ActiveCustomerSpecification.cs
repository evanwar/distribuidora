using System.Linq.Expressions;

namespace SpecificationPattern;

public class ActiveCustomerSpecification : Specification<Customer>
{
    public override Expression<Func<Customer, bool>> ToExpression()
        => customer => customer.IsActive;
}
