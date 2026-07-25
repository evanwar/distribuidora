FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS base
WORKDIR /app

USER root
RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

USER app
EXPOSE 8080

ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Directory.Packages.props NuGet.Config ./
COPY src/Distribuidora.Domain/Distribuidora.Domain.csproj src/Distribuidora.Domain/
COPY src/Distribuidora.Contracts/Distribuidora.Contracts.csproj src/Distribuidora.Contracts/
COPY src/Distribuidora.Application/Distribuidora.Application.csproj src/Distribuidora.Application/
COPY src/Distribuidora.Infrastructure/Distribuidora.Infrastructure.csproj src/Distribuidora.Infrastructure/
COPY src/Distribuidora.Api/Distribuidora.Api.csproj src/Distribuidora.Api/
RUN dotnet restore src/Distribuidora.Api/Distribuidora.Api.csproj

COPY src/ ./src/
RUN dotnet publish src/Distribuidora.Api/Distribuidora.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM base AS final
WORKDIR /app

COPY --from=build --chown=app:app /app/publish ./

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD curl --fail --silent --show-error http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["dotnet", "Distribuidora.Api.dll"]
