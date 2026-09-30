using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Entities
{

    public class Proveedor
    {
        public const int NombreMaxLength = 200;
        public Guid Id { get; private set; }
        public string Nombre { get; private set; } = null!;

        private readonly List<RecepcionLeche> _recepciones = new();
        public IReadOnlyCollection<RecepcionLeche> Recepciones => _recepciones;
        public void RegistrarRecepcion(ParametrosCalidad parametros, DateTime fechaHora, int? silo, string? observaciones)
        {
            ArgumentNullException.ThrowIfNull(parametros);
            var recepcion = RecepcionLeche.Registrar(parametros, fechaHora, silo, observaciones);
            _recepciones.Add(recepcion);
        }
        public static Proveedor Crear(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre))
            {
                throw new ArgumentException("El nombre del proveedor no puede estar vacío.", nameof(nombre));
            }

            var nombreTrim = nombre.Trim();

            if (nombreTrim.Length > NombreMaxLength)
            {
                throw new ArgumentException($"El nombre del proveedor no puede exceder {NombreMaxLength} caracteres.", nameof(nombre));
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
