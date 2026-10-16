using DairyControl.Application.Queries;
using DairyControl.Domain.Interfaces;
using DairyControl.Infrastructure.Persistence;
using DairyControl.Infrastructure.Persistence.Queries;
using DairyControl.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DairyControl.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Registers the DbContext (SQL Server, retrying on transient failures), the repositories and the queries.</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string? connectionString)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                connectionString,
                sql => sql.EnableRetryOnFailure(
                    maxRetryCount: 10,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null)));

        services.AddScoped<IProveedorRepository, ProveedorRepository>();
        services.AddScoped<IConfiguracionCalidadRepository, ConfiguracionCalidadRepository>();
        services.AddScoped<IRecepcionQueries, RecepcionQueries>();
        return services;
    }
}
