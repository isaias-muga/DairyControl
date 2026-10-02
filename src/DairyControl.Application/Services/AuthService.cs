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
    }
}