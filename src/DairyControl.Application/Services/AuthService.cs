using DairyControl.Application.DTOs;
using DairyControl.Application.Settings;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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
                    Encoding.UTF8.GetBytes(_adminUserSettings.Value.Password))) //hash passwords to a fixed length
            {
                var keyBytes = Encoding.UTF8.GetBytes(_jwtSettings.Value.SigningKey);
                var signingKey = new SymmetricSecurityKey(keyBytes);
                var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    // Generate a JWT token with the username as a claim
                    Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, dto.Username) }),
                    Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.Value.ExpiryMinutes),
                    Issuer = _jwtSettings.Value.Issuer,
                    Audience = _jwtSettings.Value.Audience,
                    SigningCredentials = credentials
                };

                var handler = new JwtSecurityTokenHandler();
                var token = handler.CreateToken(tokenDescriptor);
                return handler.WriteToken(token);
            }
            return null;
        }
    }
}