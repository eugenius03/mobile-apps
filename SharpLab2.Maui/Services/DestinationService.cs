using Microsoft.EntityFrameworkCore;
using SharpLab2.Data;
using SharpLab2.Maui.Data;
using SharpLab2.Models;

namespace SharpLab2.Services;

public class DestinationService(AppDbContext context) : BaseService<Destination>(context), IDestinationService
{
    protected override IQueryable<Destination> Query =>
        DbSet.Include(d => d.Trains);
}
