using DairyControl.Application.DTOs;
using DairyControl.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace DairyControl.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RecepcionesController : ControllerBase
    {
        private readonly ResumenRecepcionesAppService _service;

        public RecepcionesController(ResumenRecepcionesAppService service)
        {
            _service = service;
        }

        [HttpGet("resumen")]
        public async Task<ActionResult<ResumenRecepcionesDto>> GetResumenAsync(
            [FromQuery, BindRequired] DateOnly desde,
            [FromQuery, BindRequired] DateOnly hasta)
        {
            var resumen = await _service.GetResumenAsync(desde, hasta);
            return Ok(resumen);
        }
    }
}
