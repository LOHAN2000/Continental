using Continental.Api.DTOs.Auth;

namespace Continental.Api.Services.Auth;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(
        LoginRequestDto request
    );
}