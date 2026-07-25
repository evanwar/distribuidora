using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SpecificationPattern;

var builder = Host.CreateApplicationBuilder(args);

// Aspire injects the "shopdb" connection string from the AppHost and wires up
// Npgsql + EF Core. The log/sensitive-data config is what prints SQL on camera.
builder.AddNpgsqlDbContext<ShopContext>(
    "shopdb",
    configureDbContextOptions: options => options
        .LogTo(Console.WriteLine, LogLevel.Information)
        .EnableSensitiveDataLogging()); // prints parameter values in the SQL — demo only, never in prod

var app = builder.Build();

await using var scope = app.Services.CreateAsyncScope();
var db = scope.ServiceProvider.GetRequiredService<ShopContext>();

await db.Database.EnsureDeletedAsync();   // clean slate each run, so re-records are repeatable
await db.Database.EnsureCreatedAsync();
Seed(db);

// Build the rule ONCE by composing small specifications.
var cutoff = DateTime.UtcNow.AddDays(-30);
    
var promotionSpec = new ActiveCustomerSpecification()
    .And(new RegisteredBeforeSpecification(cutoff))
    .And(new MinimumSpendSpecification(500))
    .And(new AllowedCountrySpecification("US", "CA", "UK"));

// 1) Same spec, single in-memory object.
var ava = db.Customers.First();
Console.WriteLine($"\n{ava.Name} -> eligible? {promotionSpec.IsSatisfiedBy(ava)}\n");

// 2) Same spec, database query — translates to SQL (watch the log).
var eligible = await db.Customers
    .Where(promotionSpec.ToExpression())
    .ToListAsync();

Console.WriteLine($"\nEligible customers ({eligible.Count}):");
foreach (var c in eligible)
    Console.WriteLine($"  - {c.Name}");

static void Seed(ShopContext db)
{
    db.Customers.AddRange(
        new Customer { Name = "Ava",    IsActive = true,  DateRegistered = DateTime.UtcNow.AddMonths(-6), TotalSpent = 1200, Country = "US" }, // passes
        new Customer { Name = "Ben",    IsActive = true,  DateRegistered = DateTime.UtcNow.AddDays(-5),   TotalSpent = 900,  Country = "CA" }, // too new
        new Customer { Name = "Cara",   IsActive = true,  DateRegistered = DateTime.UtcNow.AddYears(-1),  TotalSpent = 120,  Country = "UK" }, // low spend
        new Customer { Name = "Dmitri", IsActive = false, DateRegistered = DateTime.UtcNow.AddYears(-2),  TotalSpent = 5000, Country = "US" }, // inactive
        new Customer { Name = "Elif",   IsActive = true,  DateRegistered = DateTime.UtcNow.AddYears(-1),  TotalSpent = 3000, Country = "DE" }  // wrong country
    );
    db.SaveChanges();
}
