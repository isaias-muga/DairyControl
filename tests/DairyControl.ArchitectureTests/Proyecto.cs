using System.Reflection;
using DairyControl.Api.Middleware;
using DairyControl.Application;
using DairyControl.Domain.Entities;
using DairyControl.Infrastructure.Persistence;

namespace DairyControl.ArchitectureTests
{
    /// <summary>The four assemblies under rule and the repository's source files.</summary>
    internal static class Proyecto
    {
        public static readonly Assembly Domain = typeof(Proveedor).Assembly;
        public static readonly Assembly Application = typeof(HoraPlanta).Assembly;
        public static readonly Assembly Infrastructure = typeof(AppDbContext).Assembly;
        public static readonly Assembly Api = typeof(ExceptionHandlingMiddleware).Assembly;

        public const string NamespaceEntidades = "DairyControl.Domain.Entities";
        public const string NamespaceObjetosDeValor = "DairyControl.Domain.ValueObjects";
        public const string NamespaceExcepciones = "DairyControl.Domain.Exceptions";

        private static readonly Lazy<string> _raiz = new(BuscarRaiz);

        /// <summary>Root of the repository: the folder that holds DairyControl.slnx.</summary>
        public static string Raiz => _raiz.Value;

        /// <summary>Every .cs file of a project under src, without the build output.</summary>
        public static IEnumerable<string> Fuentes(string proyecto) =>
            Directory.EnumerateFiles(Path.Combine(Raiz, "src", proyecto), "*.cs", SearchOption.AllDirectories)
                .Where(ruta => !EsSalidaDeCompilacion(ruta));

        private static bool EsSalidaDeCompilacion(string ruta)
        {
            var partes = ruta.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            return partes.Contains("obj") || partes.Contains("bin");
        }

        private static string BuscarRaiz()
        {
            var carpeta = new DirectoryInfo(AppContext.BaseDirectory);
            while (carpeta is not null && !File.Exists(Path.Combine(carpeta.FullName, "DairyControl.slnx")))
            {
                carpeta = carpeta.Parent;
            }
            return carpeta?.FullName
                ?? throw new InvalidOperationException("DairyControl.slnx was not found above " + AppContext.BaseDirectory);
        }
    }
}
