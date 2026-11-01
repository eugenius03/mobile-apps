using System.Globalization;
using System.Text.Json;
using PixelSvitlo.Models;

namespace PixelSvitlo.Services;

public enum LoadStatus { Idle, Loading, Ready, Error }

public record TrackedGroup(int Id, int Number, string Nickname = "", string Address = "")
{
    public string Name => string.IsNullOrWhiteSpace(Nickname) ? $"Група {Number}" : Nickname.Trim();

    public string SubName => string.IsNullOrWhiteSpace(Nickname) ? "" : $"Група {Number}";

    public OutageGroup Group => new(Id, Number);
}

public class GroupData
{
    public Schedule? Schedule { get; set; }

    public DateTime? FetchedAt { get; set; }

    public bool Stale { get; set; }

    public LoadStatus Status { get; set; }

    public string? Error { get; set; }
}

public class AppState
{
    public static readonly TimeSpan AutoRefresh = TimeSpan.FromMinutes(15);

    private const string TrackedKey = "tracked_groups";
    private const string MainKey = "main_group";
    private const string PossibleKey = "possible_as_on";
    private const string CachePrefix = "schedule_cache_";

    private readonly OutageApi _api;
    private readonly Dictionary<int, GroupData> _data = [];
    private Task? _init;
    private Timer? _tick;
    private int _ticks;

    public AppState(OutageApi api)
    {
        _api = api;
        Tracked = Load<List<TrackedGroup>>(TrackedKey) ?? [];
        var main = Preferences.Default.Get(MainKey, -1);
        MainId = Tracked.Any(t => t.Id == main) ? main : Tracked.FirstOrDefault()?.Id;
        PossibleAsOn = Preferences.Default.Get(PossibleKey, false);
    }

    public event Action? Changed;

    public IReadOnlyList<OutageGroup> Groups { get; private set; } = [];

    public LoadStatus GroupsStatus { get; private set; }

    public string? GroupsError { get; private set; }

    public List<TrackedGroup> Tracked { get; private set; }

    public int? MainId { get; private set; }

    public TrackedGroup? Main => Tracked.FirstOrDefault(t => t.Id == MainId);

    public IEnumerable<TrackedGroup> Others => Tracked.Where(t => t.Id != MainId);

    public bool PossibleAsOn { get; private set; }

    public TrackedGroup? Find(int id) => Tracked.FirstOrDefault(t => t.Id == id);

    public GroupData Data(int id) => _data.TryGetValue(id, out var d) ? d : _data[id] = new GroupData();

    public Task EnsureInitAsync() => _init ??= InitAsync();

    private async Task InitAsync()
    {
        _tick = new Timer(_ =>
        {
            var n = Interlocked.Increment(ref _ticks);
            MainThread.BeginInvokeOnMainThread(async () =>
            {
                if (n % (int)AutoRefresh.TotalMinutes == 0) await RefreshAllAsync();
                else Notify();
            });
        }, null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));

        await Task.WhenAll(LoadGroupsAsync(), RefreshAllAsync());
    }

    public async Task LoadGroupsAsync()
    {
        GroupsStatus = LoadStatus.Loading;
        Notify();
        try
        {
            Groups = await _api.FetchGroupsAsync();
            GroupsStatus = LoadStatus.Ready;
        }
        catch (OutageApiException e)
        {
            GroupsStatus = LoadStatus.Error;
            GroupsError = e.Message;
        }

        Notify();
    }

    public Task RefreshAllAsync() => Task.WhenAll(Tracked.ToList().Select(t => RefreshGroupAsync(t.Id)));

    public async Task RefreshGroupAsync(int id)
    {
        var group = Find(id);
        if (group is null) return;
        var data = Data(id);
        data.Status = LoadStatus.Loading;
        data.Error = null;
        Notify();
        try
        {
            var raw = await _api.FetchScheduleRawAsync(group.Group);
            var parsed = Schedule.Parse(raw);
            var now = DateTime.Now;
            data.Schedule = parsed;
            data.FetchedAt = now;
            data.Stale = false;
            data.Status = LoadStatus.Ready;
            SaveCache(id, raw, now);
        }
        catch (Exception e) when (e is OutageApiException or JsonException or InvalidOperationException
                                      or KeyNotFoundException or FormatException)
        {
            data.Error = e is OutageApiException ? e.Message : "Неочікувана відповідь сервера eSvitlo.";
            if (data.Schedule is not null)
            {
                data.Stale = true;
                data.Status = LoadStatus.Ready;
            }
            else if (TryLoadCache(id, out var cached, out var at))
            {
                data.Schedule = cached;
                data.FetchedAt = at;
                data.Stale = true;
                data.Status = LoadStatus.Ready;
            }
            else
            {
                data.Status = LoadStatus.Error;
            }
        }

        Notify();
    }

    public async Task AddAsync(OutageGroup g, string nickname, string address = "")
    {
        if (Tracked.Any(t => t.Id == g.Id))
        {
            if (address.Length > 0 && Tracked.First(t => t.Id == g.Id).Address.Length == 0)
            {
                Tracked = Tracked.Select(t => t.Id == g.Id ? t with { Address = address } : t).ToList();
                SaveTracked();
                Notify();
            }

            return;
        }

        Tracked = [.. Tracked, new TrackedGroup(g.Id, g.Number, nickname.Trim(), address)];
        MainId ??= g.Id;
        SaveTracked();
        Notify();
        await RefreshGroupAsync(g.Id);
    }

    public void Remove(int id)
    {
        Tracked = Tracked.Where(t => t.Id != id).ToList();
        _data.Remove(id);
        if (MainId == id) MainId = Tracked.FirstOrDefault()?.Id;
        SaveTracked();
        Notify();
    }

    public void SetMain(int id)
    {
        if (Find(id) is null) return;
        MainId = id;
        SaveTracked();
        Notify();
    }

    public void Rename(int id, string nickname)
    {
        Tracked = Tracked.Select(t => t.Id == id ? t with { Nickname = nickname.Trim() } : t).ToList();
        SaveTracked();
        Notify();
    }

    public void ClearAll()
    {
        Tracked = [];
        _data.Clear();
        MainId = null;
        SaveTracked();
        Notify();
    }

    public void SetPossibleAsOn(bool value)
    {
        PossibleAsOn = value;
        Preferences.Default.Set(PossibleKey, value);
        Notify();
    }

    private void SaveTracked()
    {
        Store(TrackedKey, Tracked);
        Preferences.Default.Set(MainKey, MainId ?? -1);
    }

    private void Notify()
    {
        if (MainThread.IsMainThread) Changed?.Invoke();
        else MainThread.BeginInvokeOnMainThread(() => Changed?.Invoke());
    }

    private static void SaveCache(int groupId, string raw, DateTime at)
    {
        Preferences.Default.Set(CachePrefix + groupId, raw);
        Preferences.Default.Set(CachePrefix + groupId + "_at", at.ToString("O", CultureInfo.InvariantCulture));
    }

    private static bool TryLoadCache(int groupId, out Schedule? schedule, out DateTime fetchedAt)
    {
        schedule = null;
        fetchedAt = default;
        var raw = Preferences.Default.Get(CachePrefix + groupId, "");
        if (raw.Length == 0) return false;
        try
        {
            schedule = Schedule.Parse(raw);
            var at = Preferences.Default.Get(CachePrefix + groupId + "_at", "");
            fetchedAt = DateTime.TryParse(at, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var t)
                ? t
                : DateTime.Now;
            return true;
        }
        catch (Exception e) when (e is JsonException or InvalidOperationException or KeyNotFoundException or FormatException)
        {
            return false;
        }
    }

    private static T? Load<T>(string key)
    {
        try
        {
            var raw = Preferences.Default.Get(key, "");
            return raw.Length == 0 ? default : JsonSerializer.Deserialize<T>(raw);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    private static void Store<T>(string key, T value) => Preferences.Default.Set(key, JsonSerializer.Serialize(value));
}
