using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Administration;

namespace Distribuidora.Application.Features.Administration;

public sealed class FolioNumberService(IAppDbContext db, IDatatimeProvider datetimeProvider)
{
    public async Task<string> NextAsync(
        string documentType,
        string fallbackPrefix,
        CancellationToken cancellationToken)
    {
        var sequence = db.Query(Specification.Create<FolioSequence>(
            x => x.DocumentType == documentType && x.Active)).SingleOrDefault();
        if (sequence is null)
            return $"{fallbackPrefix}{datetimeProvider.UtcNow:yyyyMMddHHmmssfff}";

        var folio = sequence.Next();
        await db.SaveChangesAsync(cancellationToken);
        return folio;
    }
}
