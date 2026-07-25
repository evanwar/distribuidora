using Microsoft.EntityFrameworkCore;

namespace SpecificationPattern;

public class ShopContext(DbContextOptions<ShopContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
}
