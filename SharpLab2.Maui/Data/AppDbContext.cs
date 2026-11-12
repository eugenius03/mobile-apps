using Microsoft.EntityFrameworkCore;
using SharpLab2.Models;

namespace SharpLab2.Maui.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Destination> Destinations => Set<Destination>();
    public DbSet<CarriageType> CarriageTypes => Set<CarriageType>();
    public DbSet<Passenger> Passengers => Set<Passenger>();
    public DbSet<Train> Trains => Set<Train>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
}
