using System.Globalization;
using System.Windows.Input;
using PixelSvitlo.Services;

namespace PixelSvitlo.ViewModels;

public class DetailViewModel : ObservableObject
{
    private readonly AppState _state;
    private int _id;
    private string _nickname = "";

    public DetailViewModel(AppState state)
    {
        _state = state;
        BackCommand = new Command(async () => await Shell.Current.GoToAsync(".."));
        RefreshCommand = new Command(async () => await _state.RefreshGroupAsync(_id));
        MakeMainCommand = new Command(() => _state.SetMain(_id));
        SaveNameCommand = new Command(() => _state.Rename(_id, Nickname));
        RemoveCommand = new Command(async () =>
        {
            var name = _state.Find(_id)?.Name ?? "цю групу";
            if (!await Views.Dialogs.ConfirmAsync("Видалити групу", $"Перестати відстежувати «{name}»?", "Видалити")) return;
            _state.Remove(_id);
            await Shell.Current.GoToAsync("..");
        });
        _state.Changed += Apply;
    }

    public ICommand BackCommand { get; }

    public ICommand RefreshCommand { get; }

    public ICommand MakeMainCommand { get; }

    public ICommand SaveNameCommand { get; }

    public ICommand RemoveCommand { get; }

    public string Nickname
    {
        get => _nickname;
        set => SetProperty(ref _nickname, value);
    }

    public string DefaultName => _state.Find(_id) is { } g ? $"Група {g.Number}" : "";

    public bool Exists { get; private set; }

    public bool IsMain { get; private set; }

    public bool CanMakeMain => Exists && !IsMain;

    public string Title { get; private set; } = "";

    public string Subtitle { get; private set; } = "";

    public string Address { get; private set; } = "";

    public bool HasAddress => Address.Length > 0;

    public IReadOnlyList<MainCardItem> Card { get; private set; } = [];

    public IReadOnlyList<DayItem> Days { get; private set; } = [];

    public string Updated { get; private set; } = "";

    public string StaleText { get; private set; } = "";

    public bool Stale { get; private set; }

    public void Load(int id)
    {
        _id = id;
        Nickname = _state.Find(id)?.Nickname ?? "";
        Apply();
    }

    private void Apply()
    {
        var g = _state.Find(_id);
        Exists = g is not null;
        if (g is null) return;
        var d = _state.Data(_id);
        var asOn = _state.PossibleAsOn;
        IsMain = _state.MainId == _id;
        Title = g.Name;
        Address = g.Address;
        Subtitle = (IsMain ? "Головна група" : "Відстежувана група") + (g.SubName.Length > 0 ? $" · {g.SubName}" : "");
        Card = [Present.Card(g, d, asOn) with { Address = "" }];
        Days = d.Schedule is { IsEmpty: false } s ? Present.Days(s, asOn) : [];
        Stale = d.Stale;
        StaleText = d.FetchedAt is { } at
            ? $"Офлайн. Показано збережений графік від {Fmt.Date(at)} {at.ToString("HH:mm", CultureInfo.InvariantCulture)}."
            : "Офлайн. Показано збережений графік.";
        Updated = d.FetchedAt is { } t ? $"Оновлено {t.ToString("HH:mm", CultureInfo.InvariantCulture)}" : "";
        OnPropertyChanged(string.Empty);
    }
}
