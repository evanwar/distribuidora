namespace Distribuidora.Application.Abstractions;

public interface IDatatimeProvider
{
    DateTimeOffset UtcNow { get; }
}
