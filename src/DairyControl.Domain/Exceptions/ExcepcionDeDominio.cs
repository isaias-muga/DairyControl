namespace DairyControl.Domain.Exceptions;

/// <summary>
/// Base of every exception the domain raises on purpose (a broken business rule, a duplicate, a stale edit).
/// The API maps each subtype to its HTTP status; anything that does not derive from it is a bug and a logged 500.
/// </summary>
public abstract class ExcepcionDeDominio : Exception
{
    protected ExcepcionDeDominio(string mensaje) : base(mensaje) { }
}
