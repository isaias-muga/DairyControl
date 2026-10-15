using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.Json;

namespace DairyControl.Api.Validation
{
    // Every API error has one shape: { "error": "<message in Spanish>", "field": "<camelCase name>" } (field is optional).
    public static class ApiErrors
    {
        public const string CuerpoObligatorio = "El cuerpo de la solicitud es obligatorio.";
        public const string CuerpoInvalido = "El cuerpo de la solicitud no es un JSON válido.";

        // DataAnnotations' [Required] (implicit on non-nullable properties) has an English text we cannot configure globally.
        private static readonly System.Text.RegularExpressions.Regex RequeridoIngles = new(@"^The (?<campo>.+) field is required\.$");

        public static object Body(string error, string? field = null) =>
            field is null ? new { error } : new { error, field };

        // ArgumentException.Message ends with " (Parameter 'x')" when ParamName is set; users must not see it.
        public static string Message(ArgumentException ex)
        {
            if (string.IsNullOrEmpty(ex.ParamName))
                return ex.Message;
            return ex.Message.Replace($" (Parameter '{ex.ParamName}')", string.Empty);
        }

        public static IActionResult InvalidModelState(ActionContext context)
        {
            var bodyParameters = context.ActionDescriptor.Parameters
                .Where(p => p.BindingInfo?.BindingSource == BindingSource.Body)
                .Select(p => p.Name)
                .ToHashSet();

            // The binder reports a bad body twice: the real error ("$.fechaHora") and a "dto is required" entry.
            // Show the specific one first and the generic body message only when nothing else is wrong.
            var errores = context.ModelState
                .SelectMany(e => e.Value!.Errors.Select(error => (Key: e.Key, Error: error)))
                .OrderBy(e => EsCuerpo(e.Key, bodyParameters) ? 1 : 0)
                .ToList();

            foreach (var (key, modelError) in errores)
            {
                if (EsCuerpo(key, bodyParameters))
                    return new BadRequestObjectResult(Body(CuerpoObligatorio));
                if (key == "$") // the body is not parseable JSON at all
                    return new BadRequestObjectResult(Body(CuerpoInvalido));

                var field = FieldName(key);
                // Errors keyed by a JSON path ($.x) come from the body deserializer, whose text is English.
                var requerido = RequeridoIngles.Match(modelError.ErrorMessage);
                var message = requerido.Success
                    ? $"El campo «{field}» es obligatorio."
                    : key.StartsWith('$') || modelError.Exception is JsonException or FormatException || string.IsNullOrWhiteSpace(modelError.ErrorMessage)
                    ? $"El valor de «{field}» no es válido."
                    : modelError.ErrorMessage;
                return new BadRequestObjectResult(Body(message, field));
            }
            return new BadRequestObjectResult(Body("La solicitud no es válida."));
        }

        private static bool EsCuerpo(string key, HashSet<string> bodyParameters) => key.Length == 0 || bodyParameters.Contains(key);

        // "$.fechaHora" (JSON path), "Dto.Ticket" or "desde" -> "fechaHora", "ticket", "desde"
        private static string FieldName(string key)
        {
            var name = key.Split('.', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? key;
            return name.Length == 0 ? name : char.ToLowerInvariant(name[0]) + name[1..];
        }

        public static void UseSpanishBindingMessages(Microsoft.AspNetCore.Mvc.MvcOptions options)
        {
            var p = options.ModelBindingMessageProvider;
            p.SetMissingBindRequiredValueAccessor(name => $"Falta el valor de «{name}».");
            p.SetMissingKeyOrValueAccessor(() => "Falta un valor.");
            p.SetMissingRequestBodyRequiredValueAccessor(() => CuerpoObligatorio);
            p.SetValueMustNotBeNullAccessor(_ => "Este valor es obligatorio.");
            p.SetAttemptedValueIsInvalidAccessor((value, name) => $"El valor «{value}» no es válido para «{name}».");
            p.SetNonPropertyAttemptedValueIsInvalidAccessor(value => $"El valor «{value}» no es válido.");
            p.SetUnknownValueIsInvalidAccessor(name => $"El valor de «{name}» no es válido.");
            p.SetNonPropertyUnknownValueIsInvalidAccessor(() => "El valor no es válido.");
            p.SetValueIsInvalidAccessor(value => $"El valor «{value}» no es válido.");
            p.SetValueMustBeANumberAccessor(name => $"El valor de «{name}» debe ser un número.");
            p.SetNonPropertyValueMustBeANumberAccessor(() => "El valor debe ser un número.");
        }
    }
}
