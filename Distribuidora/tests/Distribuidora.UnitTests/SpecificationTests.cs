using System.Linq.Expressions;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Distribuidora.UnitTests;

public sealed class SpecificationTests
{
    [Fact]
    public void Specifications_compose_and_apply_to_an_in_memory_query()
    {
        Product[] products =
        [
            new() { Sku = "B", Name = "Inactive", Active = false },
            new() { Sku = "C", Name = "Third", Active = true },
            new() { Sku = "A", Name = "First", Active = true }
        ];
        var specification = new ActiveProductSpecification()
            .And(new ProductSkuSpecification("A")
                .Or(new ProductSkuSpecification("C")));

        var result = products.AsQueryable()
            .Where(specification.ToExpression())
            .OrderBy(x => x.Sku)
            .Select(x => x.Name)
            .ToArray();

        Assert.Equal(["First", "Third"], result);
        Assert.True(specification.IsSatisfiedBy(products[2]));
        Assert.False(specification.IsSatisfiedBy(products[0]));
    }

    [Fact]
    public void Not_negates_a_specification()
    {
        var product = new Product { Active = false };

        Assert.True(new ActiveProductSpecification().Not().IsSatisfiedBy(product));
    }

    [Fact]
    public void Persistence_contract_accepts_only_typed_specifications()
    {
        Assert.Empty(typeof(IAppDbContext).GetProperties()
            .Where(x => x.PropertyType.IsGenericType &&
                        x.PropertyType.GetGenericTypeDefinition() == typeof(IQueryable<>)));
        Assert.Empty(typeof(AppDbContext).GetProperties()
            .Where(x => x.PropertyType.IsGenericType &&
                        x.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>)));

        var query = typeof(IAppDbContext).GetMethods().Single(x => x.Name == nameof(IAppDbContext.Query));
        Assert.Equal(typeof(Specification<>), query.GetParameters()[0].ParameterType.GetGenericTypeDefinition());
    }

    private sealed class ActiveProductSpecification : Specification<Product>
    {
        public override Expression<Func<Product, bool>> ToExpression() =>
            product => product.Active;
    }

    private sealed class ProductSkuSpecification(string sku) : Specification<Product>
    {
        public override Expression<Func<Product, bool>> ToExpression() =>
            product => product.Sku == sku;
    }
}
