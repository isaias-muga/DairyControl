using System.Text.RegularExpressions;

namespace DairyControl.ArchitectureTests
{
    // Rules about what the source says, checked by scanning the .cs files of src.
    public partial class FuentesTests
    {
        [GeneratedRegex(@"\bDateTime(Offset)?\s*\.\s*(Now|UtcNow|Today)\b")]
        private static partial Regex LecturaDeReloj();

        [GeneratedRegex(@"\bnew\s+Argument(OutOfRange)?Exception\b")]
        private static partial Regex LanzaArgumentException();

        private static readonly string[] Proyectos =
        [
            "DairyControl.Domain",
            "DairyControl.Application",
            "DairyControl.Infrastructure",
            "DairyControl.Api",
        ];

        private static bool EsComentario(string linea)
        {
            var t = linea.TrimStart();
            return t.StartsWith("//", StringComparison.Ordinal) || t.StartsWith('*') || t.StartsWith("/*", StringComparison.Ordinal);
        }

        private static List<string> Coincidencias(IEnumerable<string> proyectos, Regex patron) =>
            proyectos
                .SelectMany(Proyecto.Fuentes)
                .SelectMany(ruta => File.ReadLines(ruta).Select((linea, i) => (ruta, linea, numero: i + 1)))
                .Where(x => !EsComentario(x.linea) && patron.IsMatch(x.linea))
                .Select(x => $"{Path.GetRelativePath(Proyecto.Raiz, x.ruta)}:{x.numero}: {x.linea.Trim()}")
                .ToList();

        [Fact]
        public void Source_NeverReadsTheSystemClockDirectly()
        {
            // Arrange / Act: every "now" comes from the injected TimeProvider
            var lecturas = Coincidencias(Proyectos, LecturaDeReloj());

            // Assert
            Assert.True(lecturas.Count == 0, "Direct clock reads (use TimeProvider):" + Environment.NewLine + string.Join(Environment.NewLine, lecturas));
        }

        [Fact]
        public void DomainAndApplication_NeverThrowArgumentExceptionForBusinessRules()
        {
            // Arrange / Act: business rules throw ReglaDeNegocioException; ArgumentNullException (a bug) is still allowed
            var lanzamientos = Coincidencias(["DairyControl.Domain", "DairyControl.Application"], LanzaArgumentException());

            // Assert
            Assert.True(lanzamientos.Count == 0, "Use ReglaDeNegocioException instead:" + Environment.NewLine + string.Join(Environment.NewLine, lanzamientos));
        }

        [Fact]
        public void SourceScan_FindsTheProjectsFiles()
        {
            // Arrange / Act
            var cantidad = Proyectos.Sum(p => Proyecto.Fuentes(p).Count());

            // Assert: guards against a scan that silently looks at nothing
            Assert.True(cantidad > 50, "Expected the source files of src, found " + cantidad);
        }
    }
}
