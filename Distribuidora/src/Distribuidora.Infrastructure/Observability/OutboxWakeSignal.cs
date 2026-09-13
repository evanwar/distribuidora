using System.Threading.Channels;

namespace Distribuidora.Infrastructure.Observability;

public sealed class OutboxWakeSignal
{
    private static readonly TimeSpan RecoveryScanInterval = TimeSpan.FromSeconds(10);
    private readonly Channel<bool> _signals = Channel.CreateBounded<bool>(new BoundedChannelOptions(1)
    {
        FullMode = BoundedChannelFullMode.DropWrite,
        SingleReader = false,
        SingleWriter = false
    });

    public void Notify() => _signals.Writer.TryWrite(true);

    public async Task WaitAsync(CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(RecoveryScanInterval);
        try
        {
            await _signals.Reader.ReadAsync(timeout.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // The periodic recovery scan catches events committed by another instance
            // or notifications lost during a process restart.
        }
    }
}
