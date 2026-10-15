using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
namespace DairyControl.Infrastructure.Persistence.Repositories
{
    // SQL Server unique-violation detection: 2601 (unique index) and 2627 (unique constraint).
    public static class UnicidadSql
    {
        public static bool EsNumeroDeUnicidad(int numeroError) => numeroError is 2601 or 2627;

        public static bool EsViolacion(DbUpdateException ex) =>
            ex.InnerException is SqlException sql && EsNumeroDeUnicidad(sql.Number);
    }
}
