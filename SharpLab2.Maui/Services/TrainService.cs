using Microsoft.EntityFrameworkCore;
using SharpLab2.Data;
using SharpLab2.Maui.Data;
using SharpLab2.Models;

namespace SharpLab2.Services;

public class TrainService(AppDbContext context) : BaseService<Train>(context), ITrainService
{
    protected override IQueryable<Train> Query =>
        DbSet.Include(t => t.Destination)
             .Include(t => t.Tickets)
                .ThenInclude(tk => tk.Passenger);
}
