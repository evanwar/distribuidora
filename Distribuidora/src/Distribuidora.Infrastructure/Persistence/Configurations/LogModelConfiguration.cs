using Distribuidora.Domain.Audits;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Distribuidora.Infrastructure.Persistence;

internal static class LogModelConfiguration
{
    public static void ConfigureUserActivity(EntityTypeBuilder<UserActivityLog> b)
    {
        b.ToTable("user_activity_logs", "audit", t => t.HasCheckConstraint("ck_user_activity_duration", "\"DurationMs\" IS NULL OR \"DurationMs\" >= 0"));
        b.HasKey(x => x.Id);
        b.Property(x => x.RequestSummary).HasColumnType("jsonb");
        b.Property(x => x.ResultSummary).HasColumnType("jsonb");
        b.HasIndex(x => x.OccurredAt);
        b.HasIndex(x => new { x.UserId, x.OccurredAt });
        b.HasIndex(x => x.CorrelationId);
        b.HasIndex(x => x.OperationId);
        b.HasIndex(x => x.ReferenceFolio);
        b.HasIndex(x => new { x.Module, x.Action, x.OccurredAt });
    }

    public static void ConfigureSystemError(EntityTypeBuilder<SystemErrorLog> b)
    {
        b.ToTable("system_error_logs", "audit", t => t.HasCheckConstraint("ck_system_error_occurrences", "\"OccurrenceCount\" >= 1"));
        b.HasKey(x => x.Id);
        b.Property(x => x.InnerException).HasColumnType("jsonb");
        b.Property(x => x.ContextData).HasColumnType("jsonb");
        b.HasIndex(x => x.OccurredAt);
        b.HasIndex(x => x.CorrelationId);
        b.HasIndex(x => x.OperationId);
        b.HasIndex(x => new { x.Fingerprint, x.OccurredAt });
        b.HasIndex(x => new { x.IsResolved, x.Severity, x.OccurredAt });
        b.HasIndex(x => x.ReferenceFolio);
        b.HasIndex(x => x.EventId);
    }

    public static void ConfigureSystemEvent(EntityTypeBuilder<SystemEventLog> b)
    {
        b.ToTable("system_event_logs", "audit", t => t.HasCheckConstraint("ck_system_event_attempts", "\"AttemptCount\" >= 0"));
        b.HasKey(x => x.Id);
        b.Property(x => x.Payload).HasColumnType("jsonb");
        b.HasIndex(x => x.EventId).IsUnique();
        b.HasIndex(x => x.OperationId);
        b.HasIndex(x => x.CorrelationId);
        b.HasIndex(x => x.CausationId);
        b.HasIndex(x => new { x.Status, x.NextAttemptAt });
        b.HasIndex(x => x.ReferenceFolio);
    }
}
