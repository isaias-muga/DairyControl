namespace DairyControl.Domain.Exceptions;

/// <summary>A business rule or a plausible range was broken; <see cref="Campo"/> names the input that caused it, when there is one.</summary>
public sealed class ReglaDeNegocioException : ExcepcionDeDominio
{
    public ReglaDeNegocioException(string mensaje, string? campo = null) : base(mensaje)
    {
        Campo = campo;
    }

    public string? Campo { get; }
}
