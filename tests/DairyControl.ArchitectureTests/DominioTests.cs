using System.Reflection;
using System.Runtime.CompilerServices;

namespace DairyControl.ArchitectureTests
{
    // Entities and value objects cannot be put into an invalid state from outside.
    public class DominioTests
    {
        private const BindingFlags Instancia = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly;

        private static List<Type> TiposEn(string ns) =>
            Proyecto.Domain.GetTypes()
                .Where(t => t.Namespace == ns && !t.IsDefined(typeof(CompilerGeneratedAttribute), false) && !t.IsNested)
                .ToList();

        private static bool TieneSetterPublico(PropertyInfo propiedad) => propiedad.SetMethod is { IsPublic: true };

        private static bool TieneCampoPublicoEscribible(Type tipo) =>
            tipo.GetFields(BindingFlags.Instance | BindingFlags.Public).Any(f => !f.IsInitOnly);

        [Fact]
        public void DomainEntities_HaveNoPublicSetters()
        {
            // Arrange
            var entidades = TiposEn(Proyecto.NamespaceEntidades);

            // Act: "public init" counts as a public setter
            var mal = entidades
                .SelectMany(t => t.GetProperties(Instancia).Where(TieneSetterPublico).Select(p => $"{t.Name}.{p.Name}")
                    .Concat(TieneCampoPublicoEscribible(t) ? [$"{t.Name} (public field)"] : []))
                .ToList();

            // Assert
            Assert.NotEmpty(entidades);
            Assert.True(mal.Count == 0, "Entities with public setters: " + string.Join(", ", mal));
        }

        [Fact]
        public void ValueObjects_HaveNoSettersAtAll()
        {
            // Arrange
            var objetos = TiposEn(Proyecto.NamespaceObjetosDeValor);

            // Act: neither public, nor init, nor private: a value object is built once, by its factory
            var mal = objetos
                .SelectMany(t => t.GetProperties(Instancia).Where(p => p.SetMethod is not null).Select(p => $"{t.Name}.{p.Name}")
                    .Concat(TieneCampoPublicoEscribible(t) ? [$"{t.Name} (public field)"] : []))
                .ToList();

            // Assert
            Assert.NotEmpty(objetos);
            Assert.True(mal.Count == 0, "Value objects with setters: " + string.Join(", ", mal));
        }
    }
}
