param(
    [string]$EnvironmentFile = (Join-Path $PSScriptRoot ".env"),
    [string]$ComposeFile = (Join-Path $PSScriptRoot "compose.distribution.yml"),
    [string]$DataDirectory = (Join-Path $PSScriptRoot "catalog-import/data")
)

$ErrorActionPreference = "Stop"

function Assert-LastCommand([string]$Message) {
    if ($LASTEXITCODE -ne 0) { throw $Message }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker no esta disponible en PATH. Abre Docker Desktop y una nueva terminal de PowerShell."
}

$resolvedEnvironment = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($EnvironmentFile)
$resolvedCompose = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ComposeFile)
$resolvedData = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($DataDirectory)
$sqlFile = Join-Path $PSScriptRoot "catalog-import/import-catalog.sql"

foreach ($required in @(
    $resolvedEnvironment,
    $resolvedCompose,
    $sqlFile,
    (Join-Path $resolvedData "brands.csv"),
    (Join-Path $resolvedData "categories.csv"),
    (Join-Path $resolvedData "products.csv")
)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
        throw "No existe el archivo requerido: $required"
    }
}

$composeArguments = @("compose", "--env-file", $resolvedEnvironment, "-f", $resolvedCompose)
& docker @composeArguments up -d --wait postgres
Assert-LastCommand "PostgreSQL no inicio correctamente."

$backupDirectory = Join-Path $PSScriptRoot "backups"
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$containerBackup = "/tmp/catalog-before-$timestamp.backup"
$localBackup = Join-Path $backupDirectory "catalog-before-$timestamp.backup"

Write-Host "Creando respaldo previo en $localBackup"
& docker @composeArguments exec -T postgres sh -lc "pg_dump --username `"`$POSTGRES_USER`" --dbname `"`$POSTGRES_DB`" --format=custom --file '$containerBackup'"
Assert-LastCommand "No se pudo crear el respaldo previo a la importacion."
& docker @composeArguments cp "postgres:$containerBackup" $localBackup
Assert-LastCommand "No se pudo copiar el respaldo al equipo."
& docker @composeArguments exec -T postgres rm -f $containerBackup
Assert-LastCommand "No se pudo limpiar el respaldo temporal del contenedor."

Write-Host "Copiando el catalogo preparado al contenedor."
& docker @composeArguments exec -T postgres mkdir -p /tmp/catalog-import
Assert-LastCommand "No se pudo preparar el directorio temporal de importacion."
foreach ($name in @("brands.csv", "categories.csv", "products.csv")) {
    & docker @composeArguments cp (Join-Path $resolvedData $name) "postgres:/tmp/catalog-import/$name"
    Assert-LastCommand "No se pudo copiar $name al contenedor."
}
& docker @composeArguments cp $sqlFile "postgres:/tmp/catalog-import/import-catalog.sql"
Assert-LastCommand "No se pudo copiar el SQL de importacion."

Write-Host "Importando marcas, categorias, productos, precios y alias."
& docker @composeArguments exec -T postgres sh -lc 'psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --file /tmp/catalog-import/import-catalog.sql'
Assert-LastCommand "La importacion fallo. La transaccion fue revertida; el respaldo previo permanece disponible."

& docker @composeArguments exec -T postgres rm -rf /tmp/catalog-import
Assert-LastCommand "La importacion termino, pero no se pudo limpiar el directorio temporal."

Write-Host "Importacion terminada. Respaldo previo: $localBackup"
