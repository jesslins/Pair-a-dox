using Microsoft.AspNetCore.Mvc;
using System.Linq;
using BCrypt.Net; 
using System;
using Pair_a_dox.Models;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;

namespace Pair_a_dox.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserDbContext _dbContext;

        public UsersController(UserDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterUserDto dto)
        {
            // Check if username or email already exists
            if (_dbContext.Users.Any(u => u.UserName == dto.Username || u.Email == dto.Email))
            {
                return BadRequest("Username or Email already exists.");
            }

            // Hash the password
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // Create a new user
            var user = new User
            {
                UserName = dto.Username,
                PasswordHash = hashedPassword,
                Email = dto.Email
            };

            // Save to database
            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();

            return Ok("User created successfully.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserDto dto)
        {
            // Find user by email
            var user = _dbContext.Users.SingleOrDefault(u => u.Email == dto.Email);
            if (user == null)
            {
                // User not found, return unauthorized
                return Unauthorized("Invalid email or password.");
            }

            // Verify password using BCrypt
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                // Password invalid, return unauthorized
                return Unauthorized("Invalid email or password.");
            }

            // At this point, authentication is successful.
            // Create claims for the authenticated user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email)
            };

            // Create identity and principal for cookie authentication
            var identity = new ClaimsIdentity(claims, "CookieAuth");
            var principal = new ClaimsPrincipal(identity);

            // Sign in user with cookie authentication
            await HttpContext.SignInAsync("CookieAuth", principal);

            // Return success message
            return Ok("Login successful!");
        }


        [HttpGet("all")]
        public IActionResult GetAllUsers()
        {
            var users = _dbContext.Users.Select(u => new {
                u.UserName,
                u.Email
                // Do not include PasswordHash
            }).ToList();

            return Ok(users);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync("CookieAuth");
            return Ok("Logged out!");
        }

    }

}
