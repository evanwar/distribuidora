param(
    [string]$EnvironmentFile = (Join-Path $PSScriptRoot ".env"),
    [string]$BackupPath = (Join-Path $PSScriptRoot "backups/distribuidora.backup")
)

$ErrorActionPreference = "Stop"
$composeFile = Join-Path $PSScriptRoot "compose.distribution.yml"
$resolvedEnvironment = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($EnvironmentFile)
$resolvedBackup = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($BackupPath)

if (-not (Test-Path -LiteralPath $resolvedEnvironment)) {
    throw "No existe el archivo de configuracion: $resolvedEnvironment"
}
if (-not (Test-Path -LiteralPath $resolvedBackup)) {
    throw "No existe el respaldo: $resolvedBackup"
}

docker compose --env-file $resolvedEnvironment -f $composeFile pull
if ($LASTEXITCODE -ne 0) { throw "No se pudieron descargar las imagenes privadas." }

docker compose --env-file $resolvedEnvironment -f $composeFile up -d --wait postgres
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL no inicio correctamente." }

docker compose --env-file $resolvedEnvironment -f $composeFile cp $resolvedBackup postgres:/tmp/distribuidora.backup
if ($LASTEXITCODE -ne 0) { throw "No se pudo copiar el respaldo a PostgreSQL." }

docker compose --env-file $resolvedEnvironment -f $composeFile exec -T postgres sh -lc 'pg_restore --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges --exit-on-error /tmp/distribuidora.backup'
if ($LASTEXITCODE -ne 0) { throw "No se pudo restaurar la base de datos." }

docker compose --env-file $resolvedEnvironment -f $composeFile exec -T postgres rm -f /tmp/distribuidora.backup
docker compose --env-file $resolvedEnvironment -f $composeFile up -d --wait
if ($LASTEXITCODE -ne 0) { throw "La aplicacion no inicio correctamente." }

Write-Host "Distribuidora instalada. Abre el puerto WEB_PORT configurado en .env."
