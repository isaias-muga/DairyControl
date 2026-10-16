using DairyControl.Application.DTOs;
using DairyControl.Application.Services;
using DairyControl.Application.Settings;
using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;

namespace DairyControl.Application.Tests
{
    public class AuthServiceTests
    {
        private static readonly DateTimeOffset Ahora = new(2026, 10, 15, 15, 0, 0, TimeSpan.Zero);

        private static AuthService NuevoServicio() => new(
            Options.Create(new JwtSettings
            {
                Issuer = "dairycontrol",
                Audience = "dairycontrol-client",
                SigningKey = "una-clave-de-prueba-de-al-menos-32-caracteres",
                ExpiryMinutes = 60,
            }),
            Options.Create(new AdminUserSettings { Username = "admin", Password = "clave-de-prueba" }),
            new RelojFijo(Ahora));

        [Fact]
        public void Login_ValidCredentials_TokenExpiresOneExpiryPeriodAfterTheClock()
        {
            // Arrange
            var service = NuevoServicio();

            // Act
            var token = service.Login(new LoginDto { Username = "admin", Password = "clave-de-prueba" });

            // Assert
            Assert.NotNull(token);
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
            Assert.Equal(Ahora.UtcDateTime.AddMinutes(60), jwt.ValidTo);
        }

        [Fact]
        public void Login_WrongPassword_ReturnsNull()
        {
            // Arrange
            var service = NuevoServicio();

            // Act
            var token = service.Login(new LoginDto { Username = "admin", Password = "otra" });

            // Assert
            Assert.Null(token);
        }
    }
}
