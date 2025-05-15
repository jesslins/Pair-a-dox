namespace Pair_a_dox.Controllers
{
    public class RegisterUserDto
    {
        public string Username { get; set; }
        public string Password { get; set; } // Raw password from frontend
        public string Email { get; set; }
    }

}
