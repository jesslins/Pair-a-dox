    using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;

namespace Pair_a_dox.Models
{
    public class User
    {
        private int _id;
        private string _username;
        private string _passwordHash;
        private string _email;

        public int Id 
        { 
            get { return _id; } 
            set { _id = value; } 
        }

        [Required]
        public string UserName
        { 
            get { return _username; } 
            set { _username = value; } 
        }

        [Required]
        [EmailAddress]
        public string Email 
        { 
            get { return _email; } 
            set { _email = value; } 
        }

        [Required]
        public string PasswordHash
        {
            get { return _passwordHash; }
            set { _passwordHash = value; }
        }
    }
}
