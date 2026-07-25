using Distribuidora.Domain.Audits;
using Microsoft.EntityFrameworkCore;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;

namespace Distribuidora.Infrastructure.Persistence;

public sealed class LoggingDbContext(DbContextOptions<LoggingDbContext> options) : DbContext(options), ILogQueryStore
{
    public IQueryable<TEntity> Query<TEntity>(Specification<TEntity> specification)
        where TEntity : class =>
        Set<TEntity>().Where(specification.ToExpression());

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        LogModelConfiguration.ConfigureUserActivity(modelBuilder.Entity<UserActivityLog>());
        LogModelConfiguration.ConfigureSystemError(modelBuilder.Entity<SystemErrorLog>());
        LogModelConfiguration.ConfigureSystemEvent(modelBuilder.Entity<SystemEventLog>());
    }
}
