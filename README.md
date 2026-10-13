# DairyControl

Milk reception and quality-control system for a small dairy plant: a **.NET 10** REST API built with **Clean Architecture** and **Domain-Driven Design**, an **Angular** client, and a containerized stack with **Docker Compose**.

> **Status:** backend complete (REST API, JWT authentication, error handling, unit tests). Angular client complete for the reception module: login, protected pages, proveedores, recepción registration, Angular Material UI. Full stack runs with Docker Compose; CI builds and tests both backend and client. Demo data is seeded on startup. **Live on Azure Container Apps**, deployed automatically on every merge to `main`.

## Live demo

**https://dairycontrol-client.graywave-771c6a95.brazilsouth.azurecontainerapps.io**

Log in as `admin` with the password `demodemo123`. These credentials exist only for the demo environment, and all data is synthetic.

The demo scales to zero when nobody is using it and its database pauses, so the first request after a quiet period can take up to a minute.

## What it does

DairyControl registers milk suppliers (_proveedores_) and every delivery received at the plant (_recepción_): volume in liters, temperature, acidity, optional fat content, destination silo, timestamp and free-text notes.

The domain model is based on real reception logs from a dairy plant. All data in this repository is synthetic.

## Screenshots

| Proveedores                                           | Recepciones                                       |
| ----------------------------------------------------- | ------------------------------------------------- |
| ![Proveedores list](docs/screenshots/proveedores.png) | ![Proveedor detail](docs/screenshots/detalle.png) |

| Register recepción                                                      | Mobile                                      |
| ----------------------------------------------------------------------- | ------------------------------------------- |
| ![Registrar recepción dialog](docs/screenshots/registrar-recepcion.png) | ![Mobile view](docs/screenshots/mobile.png) |

## Quick start (Docker)

The fastest way to run everything: SQL Server, the API and the client. Only Docker is required.

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
# edit .env and set your own values
docker compose up --build
```

Open `http://localhost:8080` and log in as `admin` with the `ADMIN_PASSWORD` from `.env`. Migrations are applied automatically when the API starts. On a fresh database the API also seeds about 6 months of demo data (8 proveedores, ~1,400 recepciones), so the app looks like a plant in operation.

- Stop: `docker compose down`
- Stop and delete the database: `docker compose down -v`

## Tech stack

**Backend**

- .NET 10, ASP.NET Core Web API
- Entity Framework Core 10 + SQL Server
- JWT bearer authentication
- Swagger / OpenAPI (Swashbuckle, development only)
- xUnit + Moq

**Client**

- Angular (standalone components, signals, new control flow)
- Angular Material 3, `es-AR` locale for numbers and dates
- Reactive forms with validation mirroring the domain rules
- JWT handling with an HTTP interceptor and route guards

**Infrastructure**

- Docker (multi-stage images, non-root containers) and Docker Compose
- nginx serving the client and reverse-proxying the API
- GitHub Actions: backend and client build and tests on every push and pull request; deployment on every merge to `main`
- Azure Container Apps (consumption plan, scale to zero) and Azure SQL Database (serverless, free offer)
- GitHub Container Registry for images; Azure login from GitHub Actions with OIDC

## Architecture

Four backend layers, with dependencies pointing inward. Domain has no dependencies on any other project. The client talks to the API over HTTP and never touches the database.

```mermaid
graph TD
    Client["Angular client"] -->|HTTP + JSON| Api
    Api --> Application
    Api --> Infrastructure
    Infrastructure --> Application
    Infrastructure --> Domain
    Application --> Domain
```

| Layer              | Responsibility                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Domain**         | Entities, value objects, business rules, repository interfaces. No framework dependencies.                          |
| **Application**    | Use-case orchestration (`ProveedorAppService`, `AuthService`), DTOs, settings. Depends only on Domain abstractions. |
| **Infrastructure** | EF Core `DbContext`, Fluent API mappings, migrations, repository implementations.                                   |
| **Api**            | Controllers, middleware, authentication, dependency injection and pipeline setup (composition root).                |
| **Client**         | Angular pages, routing and services that consume the API.                                                           |

### Runtime (Docker Compose)

```mermaid
graph LR
    Browser -->|":8080"| Client["client<br/>nginx + Angular"]
    Client -->|"/api/*"| Api["api<br/>ASP.NET Core :8080"]
    Api --> Db[("db<br/>SQL Server<br/>named volume")]
```

Only the client publishes a port. The API and the database are reachable only inside the Compose network, by service name.

### Runtime (Azure)

```mermaid
graph LR
    Browser -->|HTTPS| Client["dairycontrol-client<br/>nginx + Angular<br/>external ingress"]
    Client -->|"/api/* (HTTPS)"| Api["dairycontrol-api<br/>ASP.NET Core<br/>internal ingress"]
    Api --> Db[("Azure SQL Database<br/>serverless, auto-pause")]
```

The same shape as Compose: only the client is public. The API's ingress is internal to the Container Apps environment, and the nginx upstream comes from the `API_UPSTREAM` environment variable. Both apps scale from 0 to 1 replica.

## Domain model

- **`Proveedor`** (aggregate root): the single entry point to the aggregate. Its recepciones are exposed read-only and can only be added through `RegistrarRecepcion`.
- **`RecepcionLeche`** (entity): a single delivery, owned by its `Proveedor`.
- **`ParametrosCalidad`** (value object, `record`): quality and volume measurements, validated at creation through a factory method.

## Key design decisions

**Domain and persistence**

- **Invariants live in the domain.** Factory methods, private constructors and private setters make invalid state impossible to construct, rather than relying on callers to validate.
- **One repository per aggregate.** `IProveedorRepository` is defined in Domain and implemented in Infrastructure (dependency inversion).
- **Owned types for the aggregate.** Recepciones are mapped with `OwnsMany` and quality parameters with `OwnsOne`. Recepciones have no `DbSet`, so they can't be queried or saved outside their aggregate.
- **Client-generated IDs.** The domain assigns its own `Guid` IDs and EF Core is configured with `ValueGeneratedNever()`, so new recepciones added to a loaded aggregate are inserted, not mistaken for existing rows.
- **Shared limits.** Constants such as maximum name length and decimal precision are defined once in the domain and reused by both validation and the database mapping.
- **Recepciones are records of what happened.** They can be registered but not edited or deleted; a correction flow would void a recepción with a reason rather than remove it.

**API**

- **DTOs shaped for their consumer.** The list returns a lightweight `ProveedorDto`; the detail returns `ProveedorDetalleDto` with flattened `RecepcionDto`s, so the client never sees domain value objects.
- **Global exception middleware.** Domain validation errors (`ArgumentException`) return `400` with a JSON message. Any other exception returns a generic `500` without exposing internal details.
- **Authenticated by default.** `ProveedoresController` requires a JWT at class level, so new endpoints are protected unless explicitly opened.

**Client**

- **One place for API access.** Components never call `HttpClient` directly; they go through services, and the API base URL comes from Angular environment files.
- **Client validation mirrors the domain.** Limits are mirrored in `models/limits.ts` for immediate feedback; the API remains the source of truth and its error messages are shown in the forms.

**Infrastructure and security**

- **Secrets stay out of the repo.** Locally, the JWT signing key and admin password live in .NET User Secrets; in Docker they come from a git-ignored `.env` file. `.env.example` documents the required values.
- **Single origin through a reverse proxy.** nginx serves the client and forwards `/api` to the API, so the browser never makes cross-origin calls and the database and API are not exposed.
- **Least privilege in containers.** The API and nginx images run as non-root users; multi-stage builds keep the SDK and source code out of the runtime images.
- **Passwordless deployment with OIDC.** GitHub Actions logs in to Azure with a short-lived federated token that Azure trusts only for this repository's `main` branch. The deploy identity has Contributor rights on the app's resource group only, and no cloud credentials are stored in GitHub.
- **Immutable image tags.** Images are tagged with the commit SHA, so every Azure revision maps to one commit, and a rollback is a redeploy of the previous tag.
- **Built for a serverless database.** EF Core retries transient failures (`EnableRetryOnFailure`), so the first request after the database resumes succeeds instead of failing.
- **Cost-aware hosting.** The Azure SQL free offer, the Container Apps free grant, scale to zero and a budget alert keep the demo at $0 a month.
- **Container-only behavior behind configuration flags.** Applying migrations on startup, seeding demo data and disabling HTTPS redirection are enabled only in Compose, so local development is unchanged.
- **Demo data through the domain.** The seeder creates proveedores and recepciones with the same factory methods as the API, runs once in a single transaction, and skips if any proveedor exists. Value ranges come from aggregated real reception logs; names are invented.

## API

| Method | Endpoint                            | Auth   | Description                                         |
| ------ | ----------------------------------- | ------ | --------------------------------------------------- |
| `POST` | `/api/Auth/login`                   | Public | Returns a signed JWT for valid credentials          |
| `GET`  | `/api/Proveedores`                  | JWT    | Lists all proveedores                               |
| `POST` | `/api/Proveedores`                  | JWT    | Creates a proveedor                                 |
| `GET`  | `/api/Proveedores/{id}`             | JWT    | Gets a proveedor with its recepciones, newest first |
| `POST` | `/api/Proveedores/{id}/recepciones` | JWT    | Registers a recepción on an existing proveedor      |

## Local development (without Docker)

### Prerequisites

- .NET 10 SDK
- SQL Server LocalDB (Windows, included with Visual Studio) or SQL Server Express. On Linux or macOS, use the Docker setup above.
- EF Core CLI: `dotnet tool install --global dotnet-ef`
- Node.js and the Angular CLI: `npm install -g @angular/cli`

### 1. Configure secrets

The admin username (`admin`) is in `appsettings.json`. The signing key and password must be set locally:

```bash
dotnet user-secrets set "Jwt:SigningKey" "<random string, at least 32 characters>" --project src/DairyControl.Api
dotnet user-secrets set "AdminUser:Password" "<your password>" --project src/DairyControl.Api
```

### 2. Create the database

```bash
dotnet ef database update --project src/DairyControl.Infrastructure --startup-project src/DairyControl.Api
```

### 3. Run the API

```bash
dotnet run --project src/DairyControl.Api
```

Swagger UI is available at `https://localhost:53008/swagger`. Call `POST /api/Auth/login`, copy the token, and paste it into the **Authorize** button to use the protected endpoints.

### 4. Run the client

With the API running:

```bash
cd client
npm install
ng serve
```

The app runs at `http://localhost:4200`. In development, the API's CORS policy allows requests from that origin.

## Tests

**Backend**

```bash
dotnet test --solution DairyControl.slnx
```

Unit tests, none of which touch a database:

- **Domain:** `ParametrosCalidad` validation, covering negative values, minimum volume, and optional fat content.
- **Application:** `ProveedorAppService` with a mocked repository (Moq), covering found and not-found paths, listing, recepciones mapping and ordering, and verifying that persistence methods are called exactly as often as they should be.

**Client**

```bash
cd client
npm test
```

Both suites run in GitHub Actions on every push and pull request to `main`.

## Development workflow

Every change is tracked as a GitHub Issue, implemented on a short-lived feature branch, and merged into `main` through a pull request that includes evidence (screenshots, API responses, test results). Two CI checks are required to merge: `build-test` (backend) and `client`. Environments are separated by configuration, not by branches.

Every merge to `main` is deployed automatically: once CI passes, `deploy.yml` builds both images, pushes them to GitHub Container Registry and updates both container apps.

## Roadmap

- [x] CI with GitHub Actions
- [x] `GET /api/Proveedores` list endpoint and CORS configuration
- [x] Angular client: browse proveedores and proveedor detail from the API
- [x] Angular client: login, JWT handling and protected pages
- [x] Angular client: create proveedor and register recepción forms
- [x] Angular client: UI design pass
- [x] Client build and tests in CI
- [x] Full stack with Docker Compose
- [x] Synthetic demo data seeded on startup
- [x] Deployment to Azure Container Apps with a public URL and continuous deployment
- [ ] Recepciones by period: filter by date range and proveedor (`GET /api/Recepciones`)
- [ ] Automatic summaries by day, week, month or year: total liters, quality averages and proveedor ranking (`GET /api/Recepciones/resumen`)
- [ ] Angular client: summaries page and period filter on the proveedor detail
- [ ] Chart and quality alerts: out-of-range limits as a domain rule, highlighted in the UI
- [ ] Integration tests with a real database (`WebApplicationFactory`)
- [ ] Health check endpoint
- [ ] Structured logging in the exception middleware
- [ ] Tests for `AuthService`
- [ ] Automated dependency and image updates (Dependabot)
- [ ] Database-backed user accounts (only if multiple operators are needed)
