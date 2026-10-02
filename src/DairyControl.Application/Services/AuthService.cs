using DairyControl.Application.DTOs;
using DairyControl.Application.Settings;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

namespace DairyControl.Application.Services
{
    public class AuthService
    {
        private readonly IOptions<JwtSettings> _jwtSettings;
        private readonly IOptions<AdminUserSettings> _adminUserSettings;

        public AuthService(IOptions<JwtSettings> jwtSettings, IOptions<AdminUserSettings> adminUserSettings)
        {
            _jwtSettings = jwtSettings;
            _adminUserSettings = adminUserSettings;
        }

        public string? Login(LoginDto dto)
        {
            if (dto.Username == _adminUserSettings.Value.Username &&
                CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(dto.Password),
                    Encoding.UTF8.GetBytes(_adminUserSettings.Value.Password)))
            {
                // Generate JWT token
                return "Token placeholder";
            }
            return null;
        }
    }
}