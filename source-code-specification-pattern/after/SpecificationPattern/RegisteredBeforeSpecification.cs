using System.Linq.Expressions;

namespace SpecificationPattern;

public class RegisteredBeforeSpecification : Specification<Customer>
{
    private readonly DateTime _cutoff;
    public RegisteredBeforeSpecification(DateTime cutoff) => _cutoff = cutoff;

    public override Expression<Func<Customer, bool>> ToExpression()
        => customer => customer.DateRegistered <= _cutoff;
}
