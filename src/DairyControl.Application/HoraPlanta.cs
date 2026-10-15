namespace DairyControl.Application
{
    // The plant's wall-clock time. Dates in the system have no offset: they are always plant time.
    public static class HoraPlanta
    {
        public const string ZonaHoraria = "America/Argentina/Buenos_Aires";

        public static DateTime Ahora(TimeProvider reloj) =>
            TimeZoneInfo.ConvertTimeBySystemTimeZoneId(reloj.GetUtcNow().UtcDateTime, ZonaHoraria);
    }
}
