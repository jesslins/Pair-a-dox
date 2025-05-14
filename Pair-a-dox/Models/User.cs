using System.Xml.Linq;

namespace Pair_a_dox.Models
{
    public class User
    {
        private string _username;
        private string _passwordHash;
        private string _email;

        public string UserName
        { 
            get { return _username; } 
            set { _username = value; } 
        }
  
        public string Email 
        { 
            get { return _email; } 
            set { _email = value; } 
        }

        // Password is only settable via a secure method
        public void SetPassword(string rawPassword)
        {
            _passwordHash = HashPassword(rawPassword);
        }

        public bool CheckPassword(string rawPassword)
        {
            return VerifyPassword(rawPassword, _passwordHash);
        }

        private string HashPassword(string password)
        {
            // Use a real hashing algorithm like BCrypt here
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(password));
        }

        private bool VerifyPassword(string rawPassword, string storedHash)
        {
            string rawHash = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(rawPassword));
            return rawHash == storedHash;
        }
    }
}
