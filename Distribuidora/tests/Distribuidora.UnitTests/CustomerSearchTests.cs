using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Customers;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Catalogs;

namespace Distribuidora.UnitTests;

public sealed class CustomerSearchTests
{
    [Fact]
    public void Search_matches_phone_regardless_of_common_formatting()
    {
        Customer[] customers =
        [
            new() { Name = "Angeles Flores Sanchez", Phone = "(55) 1234-5678" },
            new() { Name = "Cliente distinto", Phone = "81 0000 0000" }
        ];
        var service = new CustomerService(new QueryOnlyDbContext(customers), null!);

        var result = service.GetAll("5512345678", 20);

        Assert.Collection(
            result,
            customer => Assert.Equal("Angeles Flores Sanchez", customer.Name));
    }

    [Fact]
    public void Search_limits_the_customer_suggestions()
    {
        var customers = Enumerable.Range(1, 30)
            .Select(index => new Customer { Name = $"Customer {index:00}", Phone = "55" })
            .ToArray();
        var service = new CustomerService(new QueryOnlyDbContext(customers), null!);

        var result = service.GetAll("55", 20);

        Assert.Equal(20, result.Count);
    }

    private sealed class QueryOnlyDbContext(IEnumerable<Customer> customers) : IAppDbContext
    {
        private readonly IQueryable<Customer> customerQuery = customers.AsQueryable();

        public IQueryable<TEntity> Query<TEntity>(Specification<TEntity> specification)
            where TEntity : class
        {
            if (typeof(TEntity) != typeof(Customer))
                return Array.Empty<TEntity>().AsQueryable();

            return (IQueryable<TEntity>)customerQuery
                .Where(((Specification<Customer>)(object)specification).ToExpression());
        }

        public void Add<T>(T entity) where T : class =>
            throw new NotSupportedException();

        public void Remove<T>(T entity) where T : class =>
            throw new NotSupportedException();

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<T> ExecuteAtomicAsync<T>(
            Func<CancellationToken, Task<T>> action,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
