using DairyControl.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DairyControl.Api.Health
{
    public static class HealthEndpoints
    {
        public const string Path = "/health";

        // The context retries on failure (up to ~30 s per attempt), so without a timeout the probe would hang
        // instead of answering 503 when the database is down.
        public static readonly TimeSpan CheckTimeout = TimeSpan.FromSeconds(10);

        public static IServiceCollection AddDairyControlHealthChecks(this IServiceCollection services)
        {
            services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database");
            services.Configure<HealthCheckServiceOptions>(options =>
            {
                foreach (var registration in options.Registrations)
                    registration.Timeout = CheckTimeout;
            });
            return services;
        }

        // 200 when the API and the database are reachable, 503 otherwise. Anonymous so probes need no token.
        public static IEndpointConventionBuilder MapDairyControlHealth(this IEndpointRouteBuilder endpoints)
        {
            return endpoints.MapHealthChecks(Path).AllowAnonymous();
        }
    }
}
