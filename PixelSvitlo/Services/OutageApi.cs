using System.Text.Json;
using PixelSvitlo.Models;

namespace PixelSvitlo.Services;

public class OutageApiException(string message) : Exception(message);

public class OutageApi
{
    private static readonly Uri Base = new("https://e-svitlo-api.intercode.win");

    private readonly HttpClient _http = new() { BaseAddress = Base, Timeout = TimeSpan.FromSeconds(10) };

    public async Task<List<OutageGroup>> FetchGroupsAsync()
    {
        var body = await GetAsync("/shutdowns/groups");
        try
        {
            using var doc = JsonDocument.Parse(body);
            return doc.RootElement.EnumerateArray()
                .Select(e => new OutageGroup(e.GetProperty("id").GetInt32(), e.GetProperty("groupNumber").GetInt32()))
                .OrderBy(g => g.Number)
                .ToList();
        }
        catch (Exception e) when (e is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            throw new OutageApiException("Неочікувана відповідь сервера eSvitlo.");
        }
    }

    public const string City = "Чернівці";

    public async Task<List<string>> FetchDistrictsAsync() =>
        [City, .. ParseStrings(await GetAsync("/shutdowns/group-search/districts"))];

    public async Task<List<string>> SearchStreetsAsync(string district, string text) =>
        ParseStrings(await GetAsync(AddressQuery(district, text, null)));

    public async Task<List<AddressHit>> FetchHousesAsync(string district, string street, string number = "")
    {
        var body = await GetAsync(AddressQuery(district, street, number));
        try
        {
            using var doc = JsonDocument.Parse(body);
            return doc.RootElement.EnumerateArray()
                .Select(e => new AddressHit(
                    e.GetProperty("addressNumber").GetString() ?? "",
                    e.GetProperty("groupNumber").GetInt32(),
                    e.GetProperty("groupId").GetInt32()))
                .ToList();
        }
        catch (Exception e) when (e is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            throw new OutageApiException("Неочікувана відповідь сервера eSvitlo.");
        }
    }

    // number == null is the street autocomplete: sending addressNumber (even empty) switches the server to house records.
    private static string AddressQuery(string district, string street, string? number) =>
        "/shutdowns/group-search" +
        $"?district={Uri.EscapeDataString(district)}&addressSearch={Uri.EscapeDataString(street)}" +
        (number is null ? "" : $"&addressNumber={Uri.EscapeDataString(number)}") + "&city=";

    private static List<string> ParseStrings(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            return doc.RootElement.EnumerateArray().Select(e => e.GetString() ?? "").Where(x => x.Length > 0).ToList();
        }
        catch (Exception e) when (e is JsonException or InvalidOperationException)
        {
            throw new OutageApiException("Неочікувана відповідь сервера eSvitlo.");
        }
    }

    public Task<string> FetchScheduleRawAsync(OutageGroup group) =>
        GetAsync($"/shutdowns/schedule?groupIds={group.Id}");

    private async Task<string> GetAsync(string pathAndQuery)
    {
        try
        {
            using var res = await _http.GetAsync(pathAndQuery);
            if (!res.IsSuccessStatusCode)
            {
                throw new OutageApiException($"Помилка сервера (HTTP {(int)res.StatusCode}).");
            }

            return await res.Content.ReadAsStringAsync();
        }
        catch (OutageApiException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new OutageApiException("Немає зв'язку із сервером eSvitlo.");
        }
    }
}
