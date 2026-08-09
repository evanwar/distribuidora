using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Fiscal;

namespace Distribuidora.Application.Features.Customers;

public sealed class CustomerService(
    IAppDbContext db,
    AuditEntryService audit)
{
    public IReadOnlyCollection<Customer> GetAll(string? search = null, int? limit = null)
    {
        var normalizedSearch = search?.Trim().ToLower();
        var normalizedPhoneSearch = normalizedSearch is null
            ? string.Empty
            : string.Concat(normalizedSearch.Where(char.IsDigit));
        var specification = string.IsNullOrWhiteSpace(normalizedSearch)
            ? Specification.All<Customer>()
            : Specification.Create<Customer>(customer =>
                customer.Name.ToLower().Contains(normalizedSearch)
                || (normalizedPhoneSearch.Length > 0
                    && customer.Phone != null
                    && customer.Phone
                        .Replace(" ", string.Empty)
                        .Replace("-", string.Empty)
                        .Replace("(", string.Empty)
                        .Replace(")", string.Empty)
                        .Contains(normalizedPhoneSearch)));
        var query = db.Query(specification).OrderBy(customer => customer.Name);

        return (limit.HasValue ? query.Take(Math.Clamp(limit.Value, 1, 50)) : query).ToArray();
    }

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
        customer.TaxId = NullIfWhiteSpace(request.TaxId)?.ToUpperInvariant();
        customer.Phone = request.Phone;
        customer.Email = request.Email;
        customer.Address = request.Address;
        customer.City = request.City;
        customer.CreditLimit = request.CreditLimit;
        customer.CreditBlocked = request.CreditBlocked;
        customer.Active = request.Active;

        var hasFiscalProfileData = new[]
        {
            request.FiscalLegalName, request.FiscalZipCode,
            request.TaxRegimeCode, request.DefaultCfdiUseCode, request.InvoiceEmail
        }.Any(x => !string.IsNullOrWhiteSpace(x));
        if (hasFiscalProfileData)
        {
            if (string.IsNullOrWhiteSpace(request.TaxId) || string.IsNullOrWhiteSpace(request.FiscalLegalName) ||
                !FiscalDataRules.IsNumericCode(request.FiscalZipCode, FiscalDataRules.PostalCodeLength) ||
                !FiscalDataRules.IsNumericCode(request.TaxRegimeCode, FiscalDataRules.TaxRegimeCodeLength))
                throw new ArgumentException("RFC, fiscal legal name, five-digit fiscal ZIP code and three-digit tax regime are required for a fiscal profile.");

            var profile = customer.FiscalProfile ?? new CustomerFiscalProfile
            {
                CustomerId = customer.Id,
                CreatedBy = actorId
            };
            profile.TaxId = request.TaxId.Trim().ToUpperInvariant();
            profile.LegalName = request.FiscalLegalName.Trim().ToUpperInvariant();
            profile.FiscalZipCode = request.FiscalZipCode!;
            profile.TaxRegimeCode = request.TaxRegimeCode!;
            profile.DefaultCfdiUseCode = NullIfWhiteSpace(request.DefaultCfdiUseCode)?.ToUpperInvariant();
            profile.InvoiceEmail = NullIfWhiteSpace(request.InvoiceEmail);
            if (!profile.IsComplete())
                throw new ArgumentException("The fiscal profile contains an invalid RFC, ZIP code, tax regime or CFDI use code.");
            profile.UpdatedBy = actorId;
            customer.FiscalProfile = profile;
        }

        if (id is null) db.Add(customer);
        audit.Add(id is null ? "Create" : "Update", "catalogs", nameof(Customer), customer.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return customer;
    }

    private static string? NullIfWhiteSpace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
