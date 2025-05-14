using Microsoft.EntityFrameworkCore;
using Pair_a_dox.Models;

namespace Pair_a_dox
{
    public class UserDbContext : DbContext
    {
        public UserDbContext(DbContextOptions<UserDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
    }

}
