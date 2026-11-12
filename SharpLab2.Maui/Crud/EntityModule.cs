using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.DependencyInjection;
using SharpLab2.Models;
using SharpLab2.Services;

namespace SharpLab2.Maui.Crud;

public record EntityRow(int Id, string Primary, string Secondary);

public record EntityForm(View Content, Func<Task<List<string>>> SaveAsync);

public interface IEntityModule
{
    string Title { get; }
    Task<List<EntityRow>> LoadAsync(string? search);
    Task DeleteAsync(int id);
    Task<EntityForm> OpenFormAsync(int? id);
}

public class EntityModule<T>(
    IServiceProvider services,
    string title,
    Func<T, string> primary,
    Func<T, string> secondary,
    Func<List<Field<T>>> createFields) : IEntityModule where T : class, IEntity, new()
{
    public string Title { get; } = title;

    public async Task<List<EntityRow>> LoadAsync(string? search)
    {
        using var scope = services.CreateScope();
        var items = await scope.ServiceProvider.GetRequiredService<IBaseService<T>>().GetAllAsync();

        return items
            .Select(i => new EntityRow(i.Id, primary(i), secondary(i)))
            .Where(r => string.IsNullOrWhiteSpace(search)
                        || r.Primary.Contains(search, StringComparison.OrdinalIgnoreCase)
                        || r.Secondary.Contains(search, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public async Task DeleteAsync(int id)
    {
        using var scope = services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<IBaseService<T>>().DeleteAsync(id);
    }

    public async Task<EntityForm> OpenFormAsync(int? id)
    {
        using var scope = services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IBaseService<T>>();

        var entity = id is null ? new T() : await service.GetByIdAsync(id.Value) ?? new T();
        var fields = createFields();

        var layout = new VerticalStackLayout { Spacing = 6 };
        foreach (var field in fields)
        {
            await field.LoadAsync(scope.ServiceProvider);
            layout.Add(new Label { Text = field.Label, FontAttributes = FontAttributes.Bold, Margin = new Thickness(0, 8, 0, 0) });
            layout.Add(field.CreateView(entity));
        }

        return new EntityForm(layout, () => SaveAsync(entity, fields));
    }

    private async Task<List<string>> SaveAsync(T entity, List<Field<T>> fields)
    {
        var errors = fields.Select(f => f.Commit(entity)).OfType<string>().ToList();
        if (errors.Count > 0)
        {
            return errors;
        }

        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(entity, new ValidationContext(entity), results, validateAllProperties: true))
        {
            return results.Select(r => r.ErrorMessage ?? "Некоректні дані.").ToList();
        }

        using var scope = services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IBaseService<T>>();

        if (entity.Id == 0)
        {
            await service.CreateAsync(entity);
        }
        else
        {
            await service.UpdateAsync(entity);
        }

        return [];
    }
}
