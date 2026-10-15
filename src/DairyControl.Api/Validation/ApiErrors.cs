using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.Json;

namespace DairyControl.Api.Validation
{
    // Every API error has one shape: { "error": "<message in Spanish>", "field": "<camelCase name>" } (field is optional).
    public static class ApiErrors
    {
        public const string CuerpoObligatorio = "El cuerpo de la solicitud es obligatorio.";

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

            foreach (var (key, entry) in context.ModelState)
            {
                foreach (var modelError in entry.Errors)
                {
                    var field = FieldName(key);
                    string message;
                    if (bodyParameters.Contains(key) || key.Length == 0)
                        message = CuerpoObligatorio;
                    else if (modelError.Exception is JsonException or FormatException || string.IsNullOrWhiteSpace(modelError.ErrorMessage))
                        message = $"El valor de «{field}» no es válido.";
                    else
                        message = modelError.ErrorMessage;

                    return new BadRequestObjectResult(Body(message, bodyParameters.Contains(key) || key.Length == 0 ? null : field));
                }
            }
            return new BadRequestObjectResult(Body("La solicitud no es válida."));
        }

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
