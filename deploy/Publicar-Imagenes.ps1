param(
    [Parameter(Mandatory = $true)]
    [string]$RegistryNamespace,

    [string]$Version = "1.0.0",

    [string]$Repository = "distribuidora"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $projectRoot
try {
    docker version | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker no esta disponible." }

    docker compose build api web
    if ($LASTEXITCODE -ne 0) { throw "No se pudieron construir las imagenes." }

    docker pull postgres:16-alpine
    if ($LASTEXITCODE -ne 0) { throw "No se pudo descargar PostgreSQL." }

    docker tag distribuidora-api:local "$RegistryNamespace/${Repository}:api-$Version"
    docker tag distribuidora-web:local "$RegistryNamespace/${Repository}:web-$Version"
    docker tag postgres:16-alpine "$RegistryNamespace/${Repository}:postgres-16"

    docker push "$RegistryNamespace/${Repository}:api-$Version"
    docker push "$RegistryNamespace/${Repository}:web-$Version"
    docker push "$RegistryNamespace/${Repository}:postgres-16"

    Write-Host "Imagenes publicadas con la version $Version."
}
finally {
    Pop-Location
}
