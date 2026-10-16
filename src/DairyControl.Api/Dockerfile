# Build context: repo root (see compose.yaml)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Only the csproj files the API references, so the restore layer is cached
COPY Directory.Build.props ./
COPY src/DairyControl.Domain/DairyControl.Domain.csproj src/DairyControl.Domain/
COPY src/DairyControl.Application/DairyControl.Application.csproj src/DairyControl.Application/
COPY src/DairyControl.Infrastructure/DairyControl.Infrastructure.csproj src/DairyControl.Infrastructure/
COPY src/DairyControl.Api/DairyControl.Api.csproj src/DairyControl.Api/
RUN dotnet restore src/DairyControl.Api/DairyControl.Api.csproj

COPY src/ src/
RUN dotnet publish src/DairyControl.Api/DairyControl.Api.csproj -c Release --no-restore -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "DairyControl.Api.dll"]
