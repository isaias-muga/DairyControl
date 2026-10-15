# DairyControl

Milk reception and quality-control system for a dairy plant. Backend: .NET 10, ASP.NET Core Web API, EF Core 10, SQL Server (LocalDB in development), xUnit + Moq, Clean Architecture with Domain-Driven Design. Client: Angular (standalone components, signals) in `client/`.

## Project structure

- `DairyControl.slnx` at the repo root
- `src/DairyControl.Domain`: entities, value objects, repository interfaces
- `src/DairyControl.Application`: services, DTOs, settings
- `src/DairyControl.Infrastructure`: `AppDbContext`, EF Core configurations, migrations, repositories
- `src/DairyControl.Api`: controllers, middleware, `Program.cs`
- `tests/DairyControl.Domain.Tests`, `tests/DairyControl.Application.Tests`, `tests/DairyControl.Api.Tests` and `tests/DairyControl.Infrastructure.Tests`
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
- Plausible ranges reject typing errors and are validated in the domain (`ParametrosCalidad`, `RecepcionLeche`) and mirrored in `client/src/app/models/limits.ts`: litros > 0 and <= 30000, grasa 1-10 %, acidez 10-30 °D, temperatura 0-45 °C, agua 0-100 %, silo 1-20. They are different from the quality limits (`LimitesCalidad`): a plausible value outside the quality limits is accepted and flagged as out of range; an impossible value is rejected with a clear message.
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
- Quality limits are not configuration files: they are the single `ConfiguracionCalidad` row (aggregate root, own repository), seeded with 19 °D / 20 °C / 0 % water and editable at runtime through `GET/PUT /api/Configuracion/calidad` (`ConfiguracionCalidadAppService`). `RecepcionQueries` reads the current limits from the database on every request. The rule "out of range = acidity > max OR temperature > max OR water > max" lives only in the domain (`LimitesCalidad.FueraDeRango`, an expression so EF Core can translate it); never copy the thresholds or the rule elsewhere. Fat has no limit. Water null counts as 0.

## Infrastructure conventions

- One repository per aggregate root. Only aggregate roots get a `DbSet`.
- Child entities are mapped with `OwnsMany`; value objects with `OwnsOne`.
- Domain-generated IDs are configured with `ValueGeneratedNever()`.
- One `IEntityTypeConfiguration<T>` class per aggregate, in `Persistence/Configurations`, declared `internal`.
- Never edit a migration that has already been applied. Add a new migration instead.
- `AppDbContext` uses `EnableRetryOnFailure` (Azure SQL serverless pauses when idle). Explicit transactions must run inside `Database.CreateExecutionStrategy().ExecuteAsync(...)`; a plain `BeginTransaction` throws with a retrying strategy.

## API conventions

- Controllers are thin: call one service method and translate the result to an HTTP response. No business logic.
- Every controller has `[ApiController]` and `[Route("api/[controller]")]`.
- `ProveedoresController` has `[Authorize]` at class level: every endpoint requires a JWT, including reads. Only `AuthController` is public.
- For 201 responses, use a named route plus `CreatedAtRoute` (ASP.NET Core strips the `Async` suffix from action names, so `CreatedAtAction(nameof(...))` fails).
- `ExceptionHandlingMiddleware` maps `ArgumentException` to 400 with `{ "error": "..." }`, `TicketDuplicadoException` (the plant ticket is unique across all proveedores) to 409 with the same shape, and every other exception to a generic 500. Do not catch domain exceptions in controllers.
- Pipeline order matters: exception middleware first, then HTTPS redirection, CORS, `UseAuthentication`, `UseAuthorization`, `MapControllers`.

## Client conventions

- Standalone components only (no NgModules). Use signals for component state and the built-in control flow (`@if`, `@for`, `@empty`).
- Folders under `client/src/app`:
  - `pages/`: routed components (`login`, `resumen`, `proveedores-list`, `proveedor-detail`, `configuracion`)
  - `components/`: reusable components and dialogs (`recepcion-form`, `registrar-recepcion-dialog`, `crear-proveedor-dialog`, `observacion-celda`, `observaciones-dialog`)
  - `services/`: the only place that uses `HttpClient` (`ProveedoresService`, `RecepcionesService`, `ConfiguracionService`, `AuthService`)
  - `models/`: TypeScript interfaces mirroring the API DTOs, plus `limits.ts`
  - `guards/`, `interceptors/`, `utils/`
- Components get dependencies with `inject()`. Components never call `HttpClient` directly.
- `provideHttpClient(...)` is called only in `app.config.ts`.
- Signal inputs (`input()`) are reactive: react to changes with `effect()` or `computed()`; never read them only once in `ngOnInit`.
- Forms are reactive forms. Client validation mirrors the domain limits in `models/limits.ts`; it exists for user feedback only, and the API remains the source of truth.
- API errors are turned into user messages with `getApiErrorMessage` in `utils/api-error.ts`.
- Authentication: only `AuthService` reads or writes the token. `authInterceptor` adds the `Authorization` header; never add it manually. Protected routes use `authGuard`.
- `slowRequestInterceptor` and `ServerStatusService` show the global "waking up" banner when any request takes more than 3 seconds; pages don't add their own cold-start messages.
- The API base URL comes from `environments/`; never hardcode it.
- User-facing text is in Spanish.

### UI conventions

- Styling: each component's styles live in its own CSS file; global styles and theme in `styles.scss`.
- Form fields: mark optional fields in the label, e.g. "Silo (opcional)"; required fields keep the asterisk. Never use `mat-hint` for "opcional"; hints are only for short help text. Leave room for hints and errors so they never overlap the next field's label (form fields use dynamic subscript sizing from `app.config.ts`, and outline fields have a bottom margin in `styles.scss`).
- Tables:
  - Layout: fixed layout with percentage column widths (one column takes the rest), inside an `overflow-x: auto` container. The table fits its card on desktop without horizontal scroll. Below its `min-width` (860px) it scrolls horizontally with a visible, styled scrollbar, only on narrow screens.
  - Headers: short, one line, with the full name in a `matTooltip` and `aria-label`. Never let headers wrap or truncate.
  - Cells: single line; long text is truncated with an ellipsis and its full text in a `matTooltip`. Text that matters but does not fit (observaciones) is a real button (keyboard accessible, with a "ver más" affordance only when it is truncated) that opens a dialog with the full text and its context.
  - Alignment and padding: headers and cells are vertically centered with the same vertical padding; the first and last cells have the same horizontal padding, so text never touches a border or the card edge; quantities (liters, percentages, measurements) are right-aligned, identifiers (ticket, silo, codes) are centered and text is left-aligned; each header is aligned like its column.
- Visual check: for any UI change, before reporting back, run the app and take Playwright screenshots of every changed page at 1366px and 390px wide. Check them yourself (no clipped or truncated text, no unexpected scroll, nothing touching the edges, consistent alignment), fix what is wrong, and include the screenshots in your report. Launch Chromium with `ignoreDefaultArgs: ['--hide-scrollbars']`, otherwise scrollbars are invisible in the screenshots.

## Testing

- xUnit with Moq. Arrange-Act-Assert, with the three sections commented.
- Test names: `Method_Scenario_ExpectedResult`.
- Domain tests use real objects and no mocks.
- Application tests mock `IProveedorRepository`, created inside each test (`var mockRepo = new Mock<IProveedorRepository>();`). Domain, Application and Api tests never touch a database.
- Only `DairyControl.Infrastructure.Tests` may use a database, and only an in-memory SQLite one (schema from `EnsureCreated`, since the migrations are SQL Server-specific), for the reset/seeder logic.
- SQLite tests don't cover SQL Server-specific behavior (migrations, unique-violation error codes, query translation); those are verified manually against SQL Server until we add Testcontainers integration tests.
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
- Full stack in Docker: `docker compose up --build` (http://localhost:8080; needs a `.env` copied from `.env.example`)
- Deployment: `.github/workflows/deploy.yml` runs after CI passes on `main`: builds both images, pushes them to ghcr.io tagged with the short commit SHA, and updates both Azure container apps. Azure login uses OIDC; no credentials are stored in the repo or the workflow.
- Stop the stack and reset the database: `docker compose down -v`

### Docker / configuration flags

- The compose stack is configured only through environment variables in `.env` (`ConnectionStrings__Default`, `Jwt__SigningKey`, `AdminUser__Password`), not User Secrets. Local development keeps using LocalDB and User Secrets.
- `Database:ApplyMigrationsOnStartup` (default `false`): when `true`, the API runs `Database.Migrate()` at startup. Enabled only in `compose.yaml`.
- `HttpsRedirection:Enabled` (default `true`): when `false`, `UseHttpsRedirection` is skipped. Set to `false` only in `compose.yaml`, where the API listens on plain HTTP behind nginx.
- `DemoData:SeedOnStartup` (default `false`): when `true` and the database has no proveedores, `DemoDataSeeder` creates demo data at startup. Enabled only in `compose.yaml`.
- `DemoData:ResetOnStartup` (default `false`): when `true`, at startup (after migrations, before seeding) the API deletes all recepciones and proveedores, restores the default quality limits (`LimitesCalidad.Predeterminados`) and reseeds the demo data, in one transaction inside the execution strategy; it logs a warning with the deleted counts and never touches the admin user. It reseeds even if `SeedOnStartup` is `false`. Only for the demo environment (Azure); not enabled in `compose.yaml`.
- `API_UPSTREAM` (client image, default `http://api:8080`): where nginx proxies `/api`. `client/nginx.conf.template` is filled from environment variables when the container starts. On Azure it points to the API's internal ingress.

## How to work in this repo

- Start with a plan that lists every file you will create or change. Wait for approval before editing.
- Keep changes scoped to the task. Do not refactor unrelated code. If a new file is needed, justify it in the plan.
- After making changes, run the build and the tests (and `ng build` for client changes), and report the results.
- For UI changes, also do the visual check described in Client conventions > UI conventions.
- If a request conflicts with a rule in this file, stop and ask.
- Git: follow the Git workflow below.

## Git workflow

Claude handles branches, commits, pushes and pull requests; the developer reviews on GitHub and merges.

- Before starting an issue: `git switch main`, `git pull`, then create `feature/<issue>-<short-desc>` (e.g. `feature/53-reset-demo-data`). If the developer already created the branch, use it.
- Commit in small logical units, one concern per commit, with imperative English messages ("Add demo reset flag"). Never commit secrets, `.env` or real plant data.
- When the build, tests and visual check pass: push the branch (`git push -u origin <branch>`) and open the PR with `gh pr create`. Title `Feature <N>/<issue title>` (N is the issue number); body with Summary / Changes / Evidence / Notes (`.github/pull_request_template.md`) and `Closes #<N>`. Save the Playwright screenshots under `artifacts/pr-<N>/` (git-ignored) and list their paths in Evidence so the developer can drag them into the PR.
- Review changes: the developer comments on the PR or tells Claude. Fix them on the same branch, push, and reply with what changed.
- Never: merge PRs, push to `main`, force push, rebase or reset shared branches, delete remote branches, change GitHub settings. `.claude/settings.json` denies the riskiest commands as a safety net, but the rule holds even where no deny rule matches (for example a bare `git push` while on `main`).
- After the developer merges: `git switch main`, `git pull`, delete the local branch (`git branch -d <branch>`).

## Never do

- Public setters on domain entities.
- A `DbSet` for anything inside an aggregate.
- Business logic in controllers, DTOs or Angular components.
- Domain entities returned from Application or Api.
- `HttpClient` used outside `services/`.
- Secrets in committed files.
- Edits to already-applied migrations.
- Deleting `global.json` or pinning an SDK version in it.
