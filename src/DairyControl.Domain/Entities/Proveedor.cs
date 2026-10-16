using DairyControl.Domain.Exceptions;
using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Entities
{

    public class Proveedor
    {
        public const int NombreMaxLength = 200;
        public Guid Id { get; private set; }
        public string Nombre { get; private set; } = null!;

        public static Proveedor Crear(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre))
            {
                throw new ReglaDeNegocioException("El nombre del proveedor no puede estar vacío.", nameof(nombre));
            }

            var nombreTrim = nombre.Trim();

            if (nombreTrim.Length > NombreMaxLength)
            {
                throw new ReglaDeNegocioException($"El nombre del proveedor no puede exceder {NombreMaxLength} caracteres.", nameof(nombre));
            }
            return new Proveedor()
            {
                Id = Guid.NewGuid(),
                Nombre = nombreTrim
            };


        }

        private Proveedor() { }
    }
}
