namespace Distribuidora.Contracts.Requests;

public sealed record CancelRequest(string Reason);
public sealed record DateRangeQuery(DateTimeOffset From, DateTimeOffset To);
