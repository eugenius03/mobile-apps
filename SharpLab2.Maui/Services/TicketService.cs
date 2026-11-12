using Microsoft.EntityFrameworkCore;
using SharpLab2.Data;
using SharpLab2.Maui.Data;
using SharpLab2.Models;

namespace SharpLab2.Services;

public class TicketService(AppDbContext context) : BaseService<Ticket>(context), ITicketService
{
    protected override IQueryable<Ticket> Query =>
        DbSet.Include(t => t.Passenger)
             .Include(t => t.Train)
                .ThenInclude(tr => tr!.Destination)
             .Include(t => t.CarriageType);
}
