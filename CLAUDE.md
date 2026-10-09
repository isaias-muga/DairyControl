# DairyControl

Milk reception and quality-control system for a dairy plant. Backend: .NET 10, ASP.NET Core Web API, EF Core 10, SQL Server (LocalDB in development), xUnit + Moq, Clean Architecture with Domain-Driven Design. Client: Angular (standalone components, signals) in `client/`.

## Project structure

- `DairyControl.slnx` at the repo root
- `src/DairyControl.Domain`: entities, value objects, repository interfaces
- `src/DairyControl.Application`: services, DTOs, settings
- `src/DairyControl.Infrastructure`: `AppDbContext`, EF Core configurations, migrations, repositories
- `src/DairyControl.Api`: controllers, middleware, `Program.cs`
- `tests/DairyControl.Domain.Tests` and `tests/DairyControl.Application.Tests`
- `client/`: Angular client (see "Client conventions")
- `global.json`: opts `dotnet test` into Microsoft.Testing.Platform. Required on the .NET 10 SDK; do not delete it or pin an SDK version in it.

## Dependency rules (never break these)

- Domain references no other project and no external packages.
- Application references only Domain.
- Infrastructure references Application and Domain.
- Api references Application and Infrastructure. It is the composition root.
- EF Core types never appear in Domain or Application.
- If a type is needed by both Api and Application, it belongs in Application.

## Naming

- Domain concepts stay in Spanish, matching the existing code: `Proveedor`, `RecepcionLeche`, `ParametrosCalidad`, `Crear`, `RegistrarRecepcion`.
- Technical suffixes and infrastructure names are in English: `Repository`, `AppService`, `Dto`, `Async`, `GetByIdAsync`.
- Follow the existing names in a file before inventing new ones.

## Domain conventions

- Entities: properties use `private set`. Each entity has a private parameterless constructor (for EF Core) and a static factory method (`Crear`, `Registrar`) that validates input.
- Value objects are `record`s with a private constructor and a static `Create` method that validates.
- Validation failures throw `ArgumentException` with a clear message, using `nameof(parameter)` for the parameter name.
- Trim strings before validating their length.
- `Proveedor` is the aggregate root. `RecepcionLeche` is only created and added through `Proveedor.RegistrarRecepcion`.
- Collections are exposed as `IReadOnlyCollection<T>` backed by a private `List<T>`.
- Limits (max lengths, decimal precision/scale) are `public const` fields on the type that owns them, and the EF Core mapping reuses those constants.
- IDs are `Guid`s generated in the domain with `Guid.NewGuid()`.
- Use `= null!` only for properties that EF Core populates; never as a general way to silence nullable warnings.

## Application conventions

- Services orchestrate: call the domain factory/methods, call the repository, map to DTOs. Business rules live in Domain, not here.
- DTOs are plain classes with `get; set;` and no validation. Input and output DTOs are separate classes.
- DTOs are shaped for their consumer: the list uses the lightweight `ProveedorDto`, the detail uses `ProveedorDetalleDto` with flattened `RecepcionDto`s.
- Never return domain entities from Application. Always map to a DTO.
- Return `null` when something is not found; the controller turns it into a 404.
- Methods are `async` only when they await I/O.
- Settings classes live in `Application/Settings` and are injected as `IOptions<T>`.

## Infrastructure conventions

- One repository per aggregate root. Only aggregate roots get a `DbSet`.
- Child entities are mapped with `OwnsMany`; value objects with `OwnsOne`.
- Domain-generated IDs are configured with `ValueGeneratedNever()`.
- One `IEntityTypeConfiguration<T>` class per aggregate, in `Persistence/Configurations`, declared `internal`.
- Never edit a migration that has already been applied. Add a new migration instead.

## API conventions

- Controllers are thin: call one service method and translate the result to an HTTP response. No business logic.
- Every controller has `[ApiController]` and `[Route("api/[controller]")]`.
- `ProveedoresController` has `[Authorize]` at class level: every endpoint requires a JWT, including reads. Only `AuthController` is public.
- For 201 responses, use a named route plus `CreatedAtRoute` (ASP.NET Core strips the `Async` suffix from action names, so `CreatedAtAction(nameof(...))` fails).
- `ExceptionHandlingMiddleware` maps `ArgumentException` to 400 with `{ "error": "..." }`, and every other exception to a generic 500. Do not catch domain exceptions in controllers.
- Pipeline order matters: exception middleware first, then HTTPS redirection, CORS, `UseAuthentication`, `UseAuthorization`, `MapControllers`.

## Client conventions

- Standalone components only (no NgModules). Use signals for component state and the built-in control flow (`@if`, `@for`, `@empty`).
- Folders under `client/src/app`:
  - `pages/`: routed components (`login`, `proveedores-list`, `proveedor-detail`)
  - `components/`: reusable components (`recepcion-form`)
  - `services/`: the only place that uses `HttpClient` (`ProveedoresService`, `AuthService`)
  - `models/`: TypeScript interfaces mirroring the API DTOs, plus `limits.ts`
  - `guards/`, `interceptors/`, `utils/`
- Components get dependencies with `inject()`. Components never call `HttpClient` directly.
- `provideHttpClient(...)` is called only in `app.config.ts`.
- Signal inputs (`input()`) are reactive: react to changes with `effect()` or `computed()`; never read them only once in `ngOnInit`.
- Forms are reactive forms. Client validation mirrors the domain limits in `models/limits.ts`; it exists for user feedback only, and the API remains the source of truth.
- API errors are turned into user messages with `getApiErrorMessage` in `utils/api-error.ts`.
- Authentication: only `AuthService` reads or writes the token. `authInterceptor` adds the `Authorization` header; never add it manually. Protected routes use `authGuard`.
- The API base URL comes from `environments/`; never hardcode it.
- User-facing text is in Spanish.
- Styling: each component's styles live in its own CSS file; global styles and theme in `styles.css`.

## Testing

- xUnit with Moq. Arrange-Act-Assert, with the three sections commented.
- Test names: `Method_Scenario_ExpectedResult`.
- Domain tests use real objects and no mocks.
- Application tests mock `IProveedorRepository`, created inside each test (`var mockRepo = new Mock<IProveedorRepository>();`). No test touches a database.
- Verify persistence calls with `Verify(..., Times.Once)` or `Times.Never`, not just the returned data.
- Call `Assert.NotNull(result)` before asserting on properties of a nullable result.

## Security

- Secrets live in .NET User Secrets: `Jwt:SigningKey` and `AdminUser:Password`. Never write a secret into `appsettings.json` or any committed file.
- Compare secrets with `CryptographicOperations.FixedTimeEquals`, not `==`.

## Commands (run from the repo root unless noted)

- Build: `dotnet build DairyControl.slnx`
- Test: `dotnet test --solution DairyControl.slnx`
- Run the API: `dotnet run --project src/DairyControl.Api`
- Add a migration: `dotnet ef migrations add <Name> --project src/DairyControl.Infrastructure --startup-project src/DairyControl.Api`
- Apply migrations: `dotnet ef database update --project src/DairyControl.Infrastructure --startup-project src/DairyControl.Api`
- Client (from `client/`): `npm install`, `ng serve` (http://localhost:4200), `ng build`

## How to work in this repo

- Start with a plan that lists every file you will create or change. Wait for approval before editing.
- Keep changes scoped to the task. Do not refactor unrelated code. If a new file is needed, justify it in the plan.
- After making changes, run the build and the tests (and `ng build` for client changes), and report the results.
- If a request conflicts with a rule in this file, stop and ask.
- Do not run Git commands that change history or the remote (commit, push, branch, merge). The developer handles Git.

## Never do

- Public setters on domain entities.
- A `DbSet` for anything inside an aggregate.
- Business logic in controllers, DTOs or Angular components.
- Domain entities returned from Application or Api.
- `HttpClient` used outside `services/`.
- Secrets in committed files.
- Edits to already-applied migrations.
- Deleting `global.json` or pinning an SDK version in it.
