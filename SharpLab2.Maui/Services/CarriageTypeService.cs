using Microsoft.EntityFrameworkCore;
using SharpLab2.Data;
using SharpLab2.Maui.Data;
using SharpLab2.Models;

namespace SharpLab2.Services;

public class CarriageTypeService(AppDbContext context) : BaseService<CarriageType>(context), ICarriageTypeService
{
    protected override IQueryable<CarriageType> Query =>
        DbSet.Include(c => c.Tickets);
}
