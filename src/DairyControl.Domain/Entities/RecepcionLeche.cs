using DairyControl.Domain.ValueObjects;
namespace DairyControl.Domain.Entities
{
    public class RecepcionLeche
    {
        public ParametrosCalidad Parametros { get; private set; } = null!;
        public Guid Id { get; private set; }
        private RecepcionLeche() { }

        public static RecepcionLeche Registrar(ParametrosCalidad parametros)
        {
            return new RecepcionLeche
            {
                Id = Guid.NewGuid(),
                Parametros = parametros
            };
        }

    }
}
