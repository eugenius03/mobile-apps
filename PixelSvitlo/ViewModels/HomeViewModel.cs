using System.Globalization;
using System.Windows.Input;
using PixelSvitlo.Services;

namespace PixelSvitlo.ViewModels;

public class HomeViewModel : ObservableObject
{
    private readonly AppState _state;

    public HomeViewModel(AppState state)
    {
        _state = state;
        AddCommand = new Command(async () => await Shell.Current.GoToAsync("pick"));
        OpenCommand = new Command<int>(async id => await Shell.Current.GoToAsync($"detail?id={id}"));
        SettingsCommand = new Command(async () => await Shell.Current.GoToAsync("settings"));
        RefreshCommand = new Command(async () =>
        {
            await _state.RefreshAllAsync();
            IsRefreshing = false;
        });
        _state.Changed += Apply;
        Apply();
    }

    public ICommand AddCommand { get; }

    public ICommand OpenCommand { get; }

    public ICommand SettingsCommand { get; }

    public ICommand RefreshCommand { get; }

    private bool _isRefreshing;

    public bool IsRefreshing
    {
        get => _isRefreshing;
        set => SetProperty(ref _isRefreshing, value);
    }

    public bool IsEmpty => _state.Tracked.Count == 0;

    public bool HasGroups => !IsEmpty;

    public IReadOnlyList<MainCardItem> Main { get; private set; } = [];

    public IReadOnlyList<GroupRow> Others { get; private set; } = [];

    public bool HasOthers => Others.Count > 0;

    public bool Offline => _state.Tracked.Any(t => _state.Data(t.Id).Stale);

    public string OfflineText => _state.Tracked
        .Select(t => _state.Data(t.Id))
        .Where(d => d.Stale && d.FetchedAt is not null)
        .Min(d => d.FetchedAt) is { } at
        ? $"Офлайн. Показано збережений графік від {Fmt.Date(at)} {at.ToString("HH:mm", CultureInfo.InvariantCulture)}."
        : "Офлайн. Показано збережений графік.";

    private void Apply()
    {
        var asOn = _state.PossibleAsOn;
        Main = _state.Main is { } m ? [Present.Card(m, _state.Data(m.Id), asOn, futureOnly: true)] : [];
        Others = _state.Others.Select(g => Present.Row(g, _state.Data(g.Id), asOn)).ToList();
        OnPropertyChanged(string.Empty);
    }

    public Task LoadAsync() => _state.EnsureInitAsync();
}
