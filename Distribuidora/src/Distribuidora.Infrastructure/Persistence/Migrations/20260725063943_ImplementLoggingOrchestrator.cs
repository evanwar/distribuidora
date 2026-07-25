using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Distribuidora.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ImplementLoggingOrchestrator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_audit_logs_CreatedAt",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_EntityName_EntityId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.Sql(
                """
                ALTER TABLE audit.system_event_logs
                ALTER COLUMN "Payload" TYPE jsonb
                USING "Payload"::jsonb;
                """);

            migrationBuilder.AddColumn<string>(
                name: "AggregateId",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AggregateType",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AttemptCount",
                schema: "audit",
                table: "system_event_logs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CausationId",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CorrelationId",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CreatedAt",
                schema: "audit",
                table: "system_event_logs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "EventId",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastAttemptAt",
                schema: "audit",
                table: "system_event_logs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "NextAttemptAt",
                schema: "audit",
                table: "system_event_logs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperationId",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReferenceFolio",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceId",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceType",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TraceId",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                schema: "audit",
                table: "system_event_logs",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(
                """
                ALTER TABLE audit.outbox_messages
                ALTER COLUMN "Payload" TYPE jsonb
                USING "Payload"::jsonb;
                """);

            migrationBuilder.AddColumn<string>(
                name: "CausationId",
                schema: "audit",
                table: "outbox_messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CorrelationId",
                schema: "audit",
                table: "outbox_messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EventId",
                schema: "audit",
                table: "outbox_messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OperationId",
                schema: "audit",
                table: "outbox_messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TraceId",
                schema: "audit",
                table: "outbox_messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                schema: "audit",
                table: "outbox_messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CorrelationId",
                schema: "inventory",
                table: "inventory_movements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OperationId",
                schema: "inventory",
                table: "inventory_movements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                schema: "inventory",
                table: "inventory_movements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                """
                ALTER TABLE audit.audit_logs
                ALTER COLUMN "BeforeData" TYPE jsonb
                USING "BeforeData"::jsonb;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE audit.audit_logs
                ALTER COLUMN "AfterData" TYPE jsonb
                USING "AfterData"::jsonb;
                """);

            migrationBuilder.AddColumn<string>(
                name: "ActorIdentifier",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CausationId",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChangedProperties",
                schema: "audit",
                table: "audit_logs",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EventId",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "OccurredAt",
                schema: "audit",
                table: "audit_logs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "OperationId",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceFolio",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceId",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceType",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TraceId",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                schema: "audit",
                table: "audit_logs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "system_error_logs",
                schema: "audit",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    ErrorCode = table.Column<string>(type: "text", nullable: true),
                    ExceptionType = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    StackTrace = table.Column<string>(type: "text", nullable: true),
                    InnerException = table.Column<string>(type: "jsonb", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: true),
                    Module = table.Column<string>(type: "text", nullable: true),
                    HandlerName = table.Column<string>(type: "text", nullable: true),
                    ControllerName = table.Column<string>(type: "text", nullable: true),
                    HttpMethod = table.Column<string>(type: "text", nullable: true),
                    RequestPath = table.Column<string>(type: "text", nullable: true),
                    ResponseStatusCode = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorIdentifier = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "text", nullable: false),
                    OperationId = table.Column<string>(type: "text", nullable: false),
                    TraceId = table.Column<string>(type: "text", nullable: true),
                    RequestId = table.Column<string>(type: "text", nullable: true),
                    TransactionId = table.Column<string>(type: "text", nullable: true),
                    EventId = table.Column<string>(type: "text", nullable: true),
                    CausationId = table.Column<string>(type: "text", nullable: true),
                    ReferenceType = table.Column<string>(type: "text", nullable: true),
                    ReferenceId = table.Column<string>(type: "text", nullable: true),
                    ReferenceFolio = table.Column<string>(type: "text", nullable: true),
                    Environment = table.Column<string>(type: "text", nullable: false),
                    ApplicationVersion = table.Column<string>(type: "text", nullable: true),
                    HostName = table.Column<string>(type: "text", nullable: true),
                    ContextData = table.Column<string>(type: "jsonb", nullable: true),
                    IsResolved = table.Column<bool>(type: "boolean", nullable: false),
                    ResolvedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ResolvedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "text", nullable: true),
                    OccurrenceCount = table.Column<int>(type: "integer", nullable: false),
                    Fingerprint = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_error_logs", x => x.Id);
                    table.CheckConstraint("ck_system_error_occurrences", "\"OccurrenceCount\" >= 1");
                });

            migrationBuilder.CreateTable(
                name: "user_activity_logs",
                schema: "audit",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorIdentifier = table.Column<string>(type: "text", nullable: true),
                    SessionId = table.Column<string>(type: "text", nullable: true),
                    ActivityType = table.Column<string>(type: "text", nullable: false),
                    Module = table.Column<string>(type: "text", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    HttpMethod = table.Column<string>(type: "text", nullable: true),
                    RouteTemplate = table.Column<string>(type: "text", nullable: true),
                    RequestPath = table.Column<string>(type: "text", nullable: true),
                    ResponseStatusCode = table.Column<int>(type: "integer", nullable: true),
                    DurationMs = table.Column<long>(type: "bigint", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "text", nullable: false),
                    OperationId = table.Column<string>(type: "text", nullable: false),
                    TraceId = table.Column<string>(type: "text", nullable: true),
                    RequestId = table.Column<string>(type: "text", nullable: true),
                    TransactionId = table.Column<string>(type: "text", nullable: true),
                    CausationId = table.Column<string>(type: "text", nullable: true),
                    ReferenceType = table.Column<string>(type: "text", nullable: true),
                    ReferenceId = table.Column<string>(type: "text", nullable: true),
                    ReferenceFolio = table.Column<string>(type: "text", nullable: true),
                    EntityName = table.Column<string>(type: "text", nullable: true),
                    EntityId = table.Column<string>(type: "text", nullable: true),
                    RequestSummary = table.Column<string>(type: "jsonb", nullable: true),
                    ResultSummary = table.Column<string>(type: "jsonb", nullable: true),
                    Succeeded = table.Column<bool>(type: "boolean", nullable: false),
                    FailureCode = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_activity_logs", x => x.Id);
                    table.CheckConstraint("ck_user_activity_duration", "\"DurationMs\" IS NULL OR \"DurationMs\" >= 0");
                });

            migrationBuilder.Sql("""
                UPDATE audit.system_event_logs
                SET "EventId" = md5(random()::text || clock_timestamp()::text),
                    "CorrelationId" = md5(random()::text || clock_timestamp()::text),
                    "OperationId" = md5(random()::text || clock_timestamp()::text),
                    "CreatedAt" = now()
                WHERE "EventId" = '';
                UPDATE audit.outbox_messages
                SET "EventId" = md5(random()::text || clock_timestamp()::text),
                    "CorrelationId" = md5(random()::text || clock_timestamp()::text),
                    "OperationId" = md5(random()::text || clock_timestamp()::text)
                WHERE "EventId" = '';
                UPDATE audit.audit_logs
                SET "OccurredAt" = "CreatedAt",
                    "OperationId" = CASE WHEN "OperationId" = '' THEN md5(random()::text || clock_timestamp()::text) ELSE "OperationId" END,
                    "TransactionId" = CASE WHEN "TransactionId" = '' THEN md5(random()::text || clock_timestamp()::text) ELSE "TransactionId" END;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_system_event_logs_CausationId",
                schema: "audit",
                table: "system_event_logs",
                column: "CausationId");

            migrationBuilder.CreateIndex(
                name: "IX_system_event_logs_CorrelationId",
                schema: "audit",
                table: "system_event_logs",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_system_event_logs_EventId",
                schema: "audit",
                table: "system_event_logs",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_system_event_logs_OperationId",
                schema: "audit",
                table: "system_event_logs",
                column: "OperationId");

            migrationBuilder.CreateIndex(
                name: "IX_system_event_logs_ReferenceFolio",
                schema: "audit",
                table: "system_event_logs",
                column: "ReferenceFolio");

            migrationBuilder.CreateIndex(
                name: "IX_system_event_logs_Status_NextAttemptAt",
                schema: "audit",
                table: "system_event_logs",
                columns: new[] { "Status", "NextAttemptAt" });

            migrationBuilder.AddCheckConstraint(
                name: "ck_system_event_attempts",
                schema: "audit",
                table: "system_event_logs",
                sql: "\"AttemptCount\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_outbox_messages_CorrelationId",
                schema: "audit",
                table: "outbox_messages",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_outbox_messages_EventId",
                schema: "audit",
                table: "outbox_messages",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_outbox_messages_OperationId",
                schema: "audit",
                table: "outbox_messages",
                column: "OperationId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_CorrelationId",
                schema: "audit",
                table: "audit_logs",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EntityName_EntityId_OccurredAt",
                schema: "audit",
                table: "audit_logs",
                columns: new[] { "EntityName", "EntityId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_OperationId",
                schema: "audit",
                table: "audit_logs",
                column: "OperationId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_ReferenceFolio",
                schema: "audit",
                table: "audit_logs",
                column: "ReferenceFolio");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_TransactionId",
                schema: "audit",
                table: "audit_logs",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_UserId_OccurredAt",
                schema: "audit",
                table: "audit_logs",
                columns: new[] { "UserId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_system_error_logs_CorrelationId",
                schema: "audit",
                table: "system_error_logs",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_system_error_logs_EventId",
                schema: "audit",
                table: "system_error_logs",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_system_error_logs_Fingerprint_OccurredAt",
                schema: "audit",
                table: "system_error_logs",
                columns: new[] { "Fingerprint", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_system_error_logs_IsResolved_Severity_OccurredAt",
                schema: "audit",
                table: "system_error_logs",
                columns: new[] { "IsResolved", "Severity", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_system_error_logs_OccurredAt",
                schema: "audit",
                table: "system_error_logs",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_system_error_logs_OperationId",
                schema: "audit",
                table: "system_error_logs",
                column: "OperationId");

            migrationBuilder.CreateIndex(
                name: "IX_system_error_logs_ReferenceFolio",
                schema: "audit",
                table: "system_error_logs",
                column: "ReferenceFolio");

            migrationBuilder.CreateIndex(
                name: "IX_user_activity_logs_CorrelationId",
                schema: "audit",
                table: "user_activity_logs",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_user_activity_logs_Module_Action_OccurredAt",
                schema: "audit",
                table: "user_activity_logs",
                columns: new[] { "Module", "Action", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_user_activity_logs_OccurredAt",
                schema: "audit",
                table: "user_activity_logs",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_user_activity_logs_OperationId",
                schema: "audit",
                table: "user_activity_logs",
                column: "OperationId");

            migrationBuilder.CreateIndex(
                name: "IX_user_activity_logs_ReferenceFolio",
                schema: "audit",
                table: "user_activity_logs",
                column: "ReferenceFolio");

            migrationBuilder.CreateIndex(
                name: "IX_user_activity_logs_UserId_OccurredAt",
                schema: "audit",
                table: "user_activity_logs",
                columns: new[] { "UserId", "OccurredAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "system_error_logs",
                schema: "audit");

            migrationBuilder.DropTable(
                name: "user_activity_logs",
                schema: "audit");

            migrationBuilder.DropIndex(
                name: "IX_system_event_logs_CausationId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropIndex(
                name: "IX_system_event_logs_CorrelationId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropIndex(
                name: "IX_system_event_logs_EventId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropIndex(
                name: "IX_system_event_logs_OperationId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropIndex(
                name: "IX_system_event_logs_ReferenceFolio",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropIndex(
                name: "IX_system_event_logs_Status_NextAttemptAt",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropCheckConstraint(
                name: "ck_system_event_attempts",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropIndex(
                name: "IX_outbox_messages_CorrelationId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropIndex(
                name: "IX_outbox_messages_EventId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropIndex(
                name: "IX_outbox_messages_OperationId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_CorrelationId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_EntityName_EntityId_OccurredAt",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_OperationId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_ReferenceFolio",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_TransactionId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_UserId_OccurredAt",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "AggregateId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "AggregateType",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "AttemptCount",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "CausationId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "CorrelationId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "EventId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "LastAttemptAt",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "NextAttemptAt",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "OperationId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "ReferenceFolio",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "ReferenceId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "ReferenceType",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "TraceId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                schema: "audit",
                table: "system_event_logs");

            migrationBuilder.DropColumn(
                name: "CausationId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropColumn(
                name: "CorrelationId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropColumn(
                name: "EventId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropColumn(
                name: "OperationId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropColumn(
                name: "TraceId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                schema: "audit",
                table: "outbox_messages");

            migrationBuilder.DropColumn(
                name: "CorrelationId",
                schema: "inventory",
                table: "inventory_movements");

            migrationBuilder.DropColumn(
                name: "OperationId",
                schema: "inventory",
                table: "inventory_movements");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                schema: "inventory",
                table: "inventory_movements");

            migrationBuilder.DropColumn(
                name: "ActorIdentifier",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "CausationId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "ChangedProperties",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "EventId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "OccurredAt",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "OperationId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "Reason",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "ReferenceFolio",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "ReferenceId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "ReferenceType",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "TraceId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                schema: "audit",
                table: "audit_logs");

            migrationBuilder.Sql(
                """
                ALTER TABLE audit.system_event_logs
                ALTER COLUMN "Payload" TYPE text
                USING "Payload"::text;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE audit.outbox_messages
                ALTER COLUMN "Payload" TYPE text
                USING "Payload"::text;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE audit.audit_logs
                ALTER COLUMN "BeforeData" TYPE text
                USING "BeforeData"::text;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE audit.audit_logs
                ALTER COLUMN "AfterData" TYPE text
                USING "AfterData"::text;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_CreatedAt",
                schema: "audit",
                table: "audit_logs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EntityName_EntityId",
                schema: "audit",
                table: "audit_logs",
                columns: new[] { "EntityName", "EntityId" });
        }
    }
}
