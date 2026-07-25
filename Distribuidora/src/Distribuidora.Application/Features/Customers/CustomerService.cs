using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;

namespace Distribuidora.Application.Features.Customers;

public sealed class CustomerService(
    IAppDbContext db,
    AuditEntryService audit)
{
    public IReadOnlyCollection<Customer> GetAll() =>
        db.Query(Specification.All<Customer>()).OrderBy(x => x.Name).ToArray();

    public async Task<Customer> SaveAsync(
        Guid? id,
        CustomerRequest request,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        if (request.CreditLimit < 0)
            throw new ArgumentException("Credit limit cannot be negative.");

        var customer = id is null
            ? new Customer { CreatedBy = actorId }
            : db.Query(Specification.Create<Customer>(x => x.Id == id)).SingleOrDefault()
              ?? throw new NotFoundException("Customer not found.");

        customer.Name = request.Name.Trim();
        customer.TaxId = request.TaxId;
        customer.Phone = request.Phone;
        customer.Email = request.Email;
        customer.Address = request.Address;
        customer.City = request.City;
        customer.CreditLimit = request.CreditLimit;
        customer.CreditBlocked = request.CreditBlocked;
        customer.Active = request.Active;

        if (id is null) db.Add(customer);
        audit.Add(id is null ? "Create" : "Update", "catalogs", nameof(Customer), customer.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return customer;
    }
}
