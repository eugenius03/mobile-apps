using Microsoft.EntityFrameworkCore;
using SharpLab2.Data;
using SharpLab2.Maui.Data;
using SharpLab2.Models;

namespace SharpLab2.Services;

public abstract class BaseService<T>(AppDbContext context) : IBaseService<T> where T : class, IEntity
{
    protected readonly AppDbContext Context = context;
    protected readonly DbSet<T> DbSet = context.Set<T>();

    protected virtual IQueryable<T> Query => DbSet;

    public virtual async Task<List<T>> GetAllAsync()
    {
        return await Query.ToListAsync();
    }

    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await Query.FirstOrDefaultAsync(e => e.Id == id);
    }

    public virtual async Task<bool> ExistsAsync(int id)
    {
        return await DbSet.AnyAsync(e => e.Id == id);
    }

    public virtual async Task CreateAsync(T entity)
    {
        await BeforeCreateAsync(entity);
        await DbSet.AddAsync(entity);
        await Context.SaveChangesAsync();
        await AfterCreateAsync(entity);
    }

    public virtual async Task UpdateAsync(T entity)
    {
        await BeforeUpdateAsync(entity);
        DbSet.Update(entity);
        await Context.SaveChangesAsync();
        await AfterUpdateAsync(entity);
    }

    public virtual async Task DeleteAsync(int id)
    {
        var entity = await DbSet.FindAsync(id);
        if (entity != null)
        {
            await BeforeDeleteAsync(entity);
            DbSet.Remove(entity);
            await Context.SaveChangesAsync();
            await AfterDeleteAsync(entity);
        }
    }

    protected virtual Task BeforeCreateAsync(T entity) => Task.CompletedTask;
    protected virtual Task AfterCreateAsync(T entity) => Task.CompletedTask;
    protected virtual Task BeforeUpdateAsync(T entity) => Task.CompletedTask;
    protected virtual Task AfterUpdateAsync(T entity) => Task.CompletedTask;
    protected virtual Task BeforeDeleteAsync(T entity) => Task.CompletedTask;
    protected virtual Task AfterDeleteAsync(T entity) => Task.CompletedTask;
}
