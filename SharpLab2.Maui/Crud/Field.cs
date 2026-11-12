using System.Globalization;
using Microsoft.Extensions.DependencyInjection;
using SharpLab2.Models;
using SharpLab2.Services;

namespace SharpLab2.Maui.Crud;

public abstract class Field<T>(string label)
{
    public string Label { get; } = label;

    public virtual Task LoadAsync(IServiceProvider services) => Task.CompletedTask;

    public abstract View CreateView(T entity);

    public abstract string? Commit(T entity);
}

public class TextField<T>(string label, Func<T, string> get, Action<T, string> set) : Field<T>(label)
{
    private readonly Entry _entry = new();

    public override View CreateView(T entity)
    {
        _entry.Text = get(entity);
        return _entry;
    }

    public override string? Commit(T entity)
    {
        set(entity, _entry.Text?.Trim() ?? string.Empty);
        return null;
    }
}

public class NumberField<T, TNumber>(string label, Func<T, TNumber> get, Action<T, TNumber> set) : Field<T>(label)
    where TNumber : IParsable<TNumber>
{
    private readonly Entry _entry = new() { Keyboard = Keyboard.Numeric };

    public override View CreateView(T entity)
    {
        _entry.Text = Convert.ToString(get(entity), CultureInfo.CurrentCulture);
        return _entry;
    }

    public override string? Commit(T entity)
    {
        if (!TNumber.TryParse(_entry.Text, CultureInfo.CurrentCulture, out var value))
        {
            return $"Поле «{Label}» повинно бути числом.";
        }

        set(entity, value);
        return null;
    }
}

public static class DateText
{
    private const string Storage = "yyyy-MM-dd";
    private const string Display = "dd.MM.yyyy";

    public static string ToDisplay(string stored) =>
        DateTime.TryParseExact(stored, Storage, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            ? date.ToString(Display, CultureInfo.InvariantCulture)
            : stored;

    public static bool TryParseDisplay(string? text, out string stored)
    {
        var ok = DateTime.TryParseExact(text?.Trim(), Display, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date);
        stored = ok ? date.ToString(Storage, CultureInfo.InvariantCulture) : string.Empty;
        return ok;
    }

    public static string Today => DateTime.Today.ToString(Storage, CultureInfo.InvariantCulture);
}

public class DateField<T>(string label, Func<T, string> get, Action<T, string> set) : Field<T>(label)
{
    private readonly Entry _entry = new() { Placeholder = "дд.мм.рррр" };

    public override View CreateView(T entity)
    {
        var current = get(entity);
        _entry.Text = DateText.ToDisplay(string.IsNullOrEmpty(current) ? DateText.Today : current);
        return _entry;
    }

    public override string? Commit(T entity)
    {
        if (!DateText.TryParseDisplay(_entry.Text, out var stored))
        {
            return $"Поле «{Label}» повинно бути датою у форматі дд.мм.рррр.";
        }

        set(entity, stored);
        return null;
    }
}

public class PickerField<T, TLookup>(string label, Func<T, int> get, Action<T, int> set, Func<TLookup, string> text)
    : Field<T>(label) where TLookup : class, IEntity
{
    private readonly Picker _picker = new() { Title = "Оберіть зі списку" };
    private List<TLookup> _items = [];

    public override async Task LoadAsync(IServiceProvider services)
    {
        _items = await services.GetRequiredService<IBaseService<TLookup>>().GetAllAsync();
        _picker.ItemsSource = _items.Select(text).ToList();
    }

    public override View CreateView(T entity)
    {
        _picker.SelectedIndex = _items.FindIndex(i => i.Id == get(entity));
        return _picker;
    }

    public override string? Commit(T entity)
    {
        set(entity, _picker.SelectedIndex >= 0 ? _items[_picker.SelectedIndex].Id : 0);
        return null;
    }
}
