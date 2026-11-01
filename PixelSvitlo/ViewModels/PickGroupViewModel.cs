using System.Windows.Input;
using PixelSvitlo.Models;
using PixelSvitlo.Services;

namespace PixelSvitlo.ViewModels;

public class PickGroupViewModel : ObservableObject
{
    private readonly AppState _state;
    private const int MinStreetChars = 2;
    private readonly OutageApi _api;
    private string _nickname = "";
    private string _district = OutageApi.City;
    private string _streetQuery = "";
    private string? _street;
    private string _houseQuery = "";
    private List<AddressHit> _houses = [];
    private IReadOnlyList<string> _streets = [];
    private CancellationTokenSource? _searchCts;
    private bool _searching;
    private string? _addressError;

    public PickGroupViewModel(AppState state, OutageApi api)
    {
        _state = state;
        _api = api;
        PickStreetCommand = new Command<string>(async s => await PickStreetAsync(s));
        ClearStreetCommand = new Command(() =>
        {
            _street = null;
            _houses = [];
            HouseQuery = "";
            Refresh();
        });
        PickHouseCommand = new Command<AddressHit>(async hit => await PickGroupAsync(hit));
        PickCommand = new Command<OutageGroup>(async group =>
        {
            await _state.AddAsync(group, Nickname);
            Nickname = "";
            await Shell.Current.GoToAsync("..");
        });
        RetryCommand = new Command(async () => await _state.LoadGroupsAsync());
        BackCommand = new Command(async () => await Shell.Current.GoToAsync(".."));
        _state.Changed += () => OnPropertyChanged(string.Empty);
    }

    public ICommand PickStreetCommand { get; }

    public ICommand ClearStreetCommand { get; }

    public ICommand PickHouseCommand { get; }

    public ICommand PickCommand { get; }

    public ICommand RetryCommand { get; }

    public ICommand BackCommand { get; }

    public string Nickname
    {
        get => _nickname;
        set => SetProperty(ref _nickname, value);
    }

    public string Title => _state.Tracked.Count == 0 ? "Оберіть свою групу" : "Додати групу";

    public string Hint => _state.Tracked.Count == 0
        ? "Перша група стане головною."
        : "Групи, які ви вже відстежуєте, затемнені.";

    public IReadOnlyList<GroupItem> Groups => _state.Groups
        .Select(g => new GroupItem(g, g.Number.ToString(), _state.Find(g.Id) is null ? Colors.White : Fmt.Bg))
        .ToList();

    public bool ShowGroups => _state.Groups.Count > 0;

    public bool ShowError => !ShowGroups && _state.GroupsStatus == LoadStatus.Error;

    public string Error => _state.GroupsError ?? "Не вдалося завантажити групи.";

    public bool ShowLoading => !ShowGroups && !ShowError;

    public Task LoadAsync() => _state.EnsureInitAsync();


    public IReadOnlyList<string> Districts { get; private set; } = [OutageApi.City];

    private string _districtText = OutageApi.City;
    private string? _districtFilter;
    private bool _districtOpen;

    public string DistrictText
    {
        get => _districtText;
        set
        {
            if (!SetProperty(ref _districtText, value)) return;
            _districtFilter = value;
            _districtOpen = true;
            var exact = Districts.FirstOrDefault(d => string.Equals(d, value.Trim(), StringComparison.CurrentCultureIgnoreCase));
            if (exact is not null && exact != _district) District = exact;
            NotifyDistrictList();
        }
    }

    public IReadOnlyList<string> DistrictSuggestions => !_districtOpen ? [] : Districts
        .Where(d => string.IsNullOrWhiteSpace(_districtFilter) || d.Contains(_districtFilter.Trim(), StringComparison.CurrentCultureIgnoreCase))
        .ToList();

    public bool ShowDistrictSuggestions => DistrictSuggestions.Count > 0;

    public bool ShowNoDistricts => _districtOpen && DistrictSuggestions.Count == 0;

    public ICommand PickDistrictCommand => new Command<string>(d =>
    {
        District = d;
        _districtOpen = false;
        NotifyDistrictList();
        DistrictChosen?.Invoke();
    });

    public event Action? DistrictChosen;

    public ICommand ToggleDistrictsCommand => new Command(() =>
    {
        _districtOpen = !_districtOpen;
        _districtFilter = null;
        NotifyDistrictList();
    });

    public void OpenDistricts()
    {
        _districtOpen = true;
        _districtFilter = null;
        NotifyDistrictList();
    }

    public void CommitDistrict()
    {
        _districtOpen = false;
        if (!Districts.Any(d => d == _districtText))
        {
            _districtText = _district;
            OnPropertyChanged(nameof(DistrictText));
        }

        NotifyDistrictList();
    }

    private void NotifyDistrictList()
    {
        OnPropertyChanged(nameof(DistrictSuggestions));
        OnPropertyChanged(nameof(ShowDistrictSuggestions));
        OnPropertyChanged(nameof(ShowNoDistricts));
    }

    public string District
    {
        get => _district;
        set
        {
            if (!SetProperty(ref _district, value)) return;
            if (_districtText != value)
            {
                _districtText = value;
                OnPropertyChanged(nameof(DistrictText));
            }

            _street = null;
            _houses = [];
            _streets = [];
            StreetQuery = "";
        }
    }

    public string StreetQuery
    {
        get => _streetQuery;
        set
        {
            if (!SetProperty(ref _streetQuery, value)) return;
            _ = SearchStreetsAsync();
        }
    }

    public string HouseQuery
    {
        get => _houseQuery;
        set
        {
            if (!SetProperty(ref _houseQuery, value)) return;
            OnPropertyChanged(nameof(Houses));
            OnPropertyChanged(nameof(HouseHint));
        }
    }

    public IReadOnlyList<string> Streets => _streets;

    public bool ShowStreetResults => _street is null && _streets.Count > 0;

    public bool ShowNoStreets => _street is null && !_searching && _addressError is null
                                 && StreetQuery.Trim().Length >= MinStreetChars && _streets.Count == 0;

    public bool PickingStreet => _street is null;

    public bool HasStreet => _street is not null;

    public string Street => _street ?? "";

    public string? AddressError => _addressError;

    public bool ShowAddressError => _addressError is not null;

    public bool AllSameGroup => _houses.Count > 0 && _houses.Select(h => h.GroupId).Distinct().Count() == 1;

    public string WholeStreetText => AllSameGroup ? $"Вся вулиця · Група {_houses[0].GroupNumber}" : "";

    public ICommand PickWholeStreetCommand => new Command(async () =>
    {
        if (AllSameGroup) await PickGroupAsync(_houses[0]);
    });

    public string HouseHint => _houses.Count == 0 ? "" : HouseQuery.Trim().Length == 0
        ? $"Будинків: {_houses.Count}. Введіть номер, щоб звузити."
        : Houses.Count == 0 ? "Такого будинку на цій вулиці немає." : "";

    public IReadOnlyList<HouseItem> Houses
    {
        get
        {
            var q = HouseQuery.Trim();
            return _houses
                .Where(h => q.Length == 0 || h.Number.Contains(q, StringComparison.OrdinalIgnoreCase))
                .OrderBy(h => h.Number.StartsWith(q, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
                .ThenBy(h => h.Number.Length)
                .ThenBy(h => h.Number, StringComparer.OrdinalIgnoreCase)
                .Take(8)
                .Select(h => new HouseItem(h.Number.Length == 0 ? "Без номера" : h.Number, $"Група {h.GroupNumber}", h))
                .ToList();
        }
    }

    public async Task LoadDistrictsAsync()
    {
        if (Districts.Count > 1) return;
        try
        {
            Districts = await _api.FetchDistrictsAsync();
            OnPropertyChanged(nameof(Districts));
            OnPropertyChanged(nameof(District));
        }
        catch (OutageApiException)
        {
        }
    }

    private async Task SearchStreetsAsync()
    {
        _searchCts?.Cancel();
        var q = StreetQuery.Trim();
        if (q.Length < MinStreetChars)
        {
            _streets = [];
            _addressError = null;
            Refresh();
            return;
        }

        var cts = _searchCts = new CancellationTokenSource();
        try
        {
            await Task.Delay(300, cts.Token);
            _searching = true;
            Refresh();
            var found = await _api.SearchStreetsAsync(District, q);
            if (cts.IsCancellationRequested) return;
            _streets = found.Take(8).ToList();
            _addressError = null;
        }
        catch (TaskCanceledException)
        {
            return;
        }
        catch (OutageApiException e)
        {
            if (cts.IsCancellationRequested) return;
            _streets = [];
            _addressError = e.Message;
        }

        _searching = false;
        Refresh();
    }

    private async Task PickStreetAsync(string street)
    {
        try
        {
            _houses = await _api.FetchHousesAsync(District, street);
            _street = street;
            _streets = [];
            _addressError = null;
            HouseQuery = "";
        }
        catch (OutageApiException e)
        {
            _addressError = e.Message;
        }

        Refresh();
    }

    private async Task PickGroupAsync(AddressHit hit)
    {
        var group = _state.Groups.FirstOrDefault(g => g.Id == hit.GroupId)
                    ?? _state.Groups.FirstOrDefault(g => g.Number == hit.GroupNumber);
        if (group is null)
        {
            _addressError = $"Групи {hit.GroupNumber} поки немає.";
            Refresh();
            return;
        }

        await _state.AddAsync(group, Nickname, FormatAddress(hit));
        Nickname = "";
        await Shell.Current.GoToAsync("..");
    }

    private string FormatAddress(AddressHit hit)
    {
        var parts = new List<string>();
        if (District != OutageApi.City) parts.Add(District);
        var street = _street ?? "";
        parts.Add(street.Any(char.IsLower) ? street : Capitalize(street));
        var whole = AllSameGroup && HouseQuery.Trim().Length == 0 && _houses.Count > 1 && ReferenceEquals(hit, _houses[0]);
        if (!whole && hit.Number.Length > 0) parts.Add(hit.Number);
        return string.Join(", ", parts);
    }

    private static string Capitalize(string upper) =>
        string.Join(' ', upper.ToLowerInvariant().Split(' ').Select(w => w.Length == 0 ? w : char.ToUpperInvariant(w[0]) + w[1..]));

    private void Refresh() => OnPropertyChanged(string.Empty);
}
