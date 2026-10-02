using DairyControl.Application.DTOs;
using DairyControl.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DairyControl.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly ProveedorAppService _service;

        public ProveedoresController(ProveedorAppService service)
        {
            _service = service;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ProveedorDto>> CrearAsync([FromBody] CrearProveedorDto dto)
        {
            var proveedor = await _service.CrearAsync(dto);
            return CreatedAtRoute("GetProveedorById", new { id = proveedor.Id }, proveedor);
        }

        [HttpGet("{id}", Name = "GetProveedorById")]
        public async Task<ActionResult<ProveedorDto>> GetByIdAsync(Guid id)
        {
            var proveedor = await _service.GetByIdAsync(id);
            if (proveedor == null)
            {
                return NotFound();
            }
            return Ok(proveedor);
        }

        [HttpPost("{id}/recepciones")]
        [Authorize]
        public async Task<ActionResult<ProveedorDto>> RegistrarRecepcionAsync(Guid id, [FromBody] RegistrarRecepcionDto dto)
        {
            var proveedor = await _service.RegistrarRecepcionAsync(id, dto);
            if (proveedor == null)
            {
                return NotFound();
            }
            return Ok(proveedor);
        }
    }
}