using System.Linq.Expressions;

namespace SpecificationPattern;

public class AllowedCountrySpecification : Specification<Customer>
{
    private readonly string[] _countries;
    public AllowedCountrySpecification(params string[] countries) => _countries = countries;

    public override Expression<Func<Customer, bool>> ToExpression()
        => customer => _countries.Contains(customer.Country);
}
