param(
    [string]$OutputPath = (Join-Path $PSScriptRoot "backups/distribuidora.backup"),
    [string]$ComposeFile = (Join-Path (Split-Path -Parent $PSScriptRoot) "docker-compose.yml")
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$resolvedCompose = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ComposeFile)
$outputDirectory = Split-Path -Parent $resolvedOutput

if (-not (Test-Path -LiteralPath $resolvedCompose)) {
    throw "No existe el archivo Compose: $resolvedCompose"
}

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

Push-Location $projectRoot
try {
    docker compose -f $resolvedCompose exec -T postgres sh -lc 'pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --format=custom --file=/tmp/distribuidora.backup'
    if ($LASTEXITCODE -ne 0) { throw "No se pudo respaldar PostgreSQL." }

    docker compose -f $resolvedCompose cp postgres:/tmp/distribuidora.backup $resolvedOutput
    if ($LASTEXITCODE -ne 0) { throw "No se pudo copiar el respaldo." }

    docker compose -f $resolvedCompose exec -T postgres rm -f /tmp/distribuidora.backup
    Write-Host "Respaldo creado en $resolvedOutput"
}
finally {
    Pop-Location
}
