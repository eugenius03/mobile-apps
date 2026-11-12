using Microsoft.EntityFrameworkCore;
using SharpLab2.Data;
using SharpLab2.Maui.Data;
using SharpLab2.Models;

namespace SharpLab2.Services;

public class PassengerService(AppDbContext context) : BaseService<Passenger>(context), IPassengerService
{
    protected override IQueryable<Passenger> Query =>
        DbSet.Include(p => p.Tickets)
                .ThenInclude(t => t.Train)
                    .ThenInclude(tr => tr!.Destination)
             .Include(p => p.Tickets)
                .ThenInclude(t => t.CarriageType);
}
