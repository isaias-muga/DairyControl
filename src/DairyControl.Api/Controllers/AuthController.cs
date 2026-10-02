using DairyControl.Application.DTOs;
using DairyControl.Application.Services;
using Microsoft.AspNetCore.Mvc;
namespace DairyControl.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]

        public ActionResult Login([FromBody] LoginDto dto)
        {
            var token = _authService.Login(dto);
            if (token == null)
            {
                return Unauthorized();
            }
            return Ok(new { token });
        }
    }
}
