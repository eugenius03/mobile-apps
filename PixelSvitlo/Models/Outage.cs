using System.Globalization;
using System.Text.Json;

namespace PixelSvitlo.Models;

public enum Availability { On, Off, Possible }

public record OutageGroup(int Id, int Number);

public static class Kyiv
{
    private static DateTime LastSunday(int year, int month)
    {
        var d = new DateTime(year, month, 31, 1, 0, 0, DateTimeKind.Utc);
        while (d.DayOfWeek != DayOfWeek.Sunday)
        {
            d = d.AddDays(-1);
        }

        return d;
    }

    public static TimeSpan Offset(DateTime utc)
    {
        var summer = utc >= LastSunday(utc.Year, 3) && utc < LastSunday(utc.Year, 10);
        return TimeSpan.FromHours(summer ? 3 : 2);
    }

    public static DateTime ToKyiv(DateTime t)
    {
        var u = t.ToUniversalTime();
        return DateTime.SpecifyKind(u + Offset(u), DateTimeKind.Unspecified);
    }

    public static DateTime Day(DateTime t)
    {
        var k = ToKyiv(t);
        return new DateTime(k.Year, k.Month, k.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    public static DateTime MidnightUtc(DateTime day) =>
        day - Offset(day - TimeSpan.FromHours(3));
}

public record Slot(DateTime Start, Availability Availability, bool Emergency = false)
{
    public DateTime End => Start.AddMinutes(30);
}

public record Run(DateTime Start, DateTime End, Availability Availability)
{
    public TimeSpan Length => End - Start;
}

public class Schedule
{
    public Schedule(IEnumerable<Slot> slots)
    {
        Slots = slots.OrderBy(s => s.Start).ToList();
        Runs = Merge(Slots);
    }

    public IReadOnlyList<Slot> Slots { get; }

    public IReadOnlyList<Run> Runs { get; }

    public bool IsEmpty => Slots.Count == 0;

    public static Schedule Parse(string raw)
    {
        using var doc = JsonDocument.Parse(raw);
        var slots = new List<Slot>();
        foreach (var e in doc.RootElement.EnumerateArray())
        {
            var start = DateTimeOffset.Parse(
                e.GetProperty("dateTime").GetString()!,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal).UtcDateTime;
            var avail = e.GetProperty("availability").GetInt32() switch
            {
                1 => Availability.Off,
                2 => Availability.Possible,
                _ => Availability.On,
            };
            var emergency = e.TryGetProperty("isEmergency", out var em) && em.ValueKind == JsonValueKind.True;
            slots.Add(new Slot(start, avail, emergency));
        }

        return new Schedule(slots);
    }

    private static List<Run> Merge(IReadOnlyList<Slot> slots)
    {
        var output = new List<Run>();
        foreach (var s in slots)
        {
            if (output.Count > 0 && output[^1].Availability == s.Availability && output[^1].End == s.Start)
            {
                output[^1] = output[^1] with { End = s.End };
            }
            else
            {
                output.Add(new Run(s.Start, s.End, s.Availability));
            }
        }

        return output;
    }

    public Run? CurrentRun(DateTime now)
    {
        var n = now.ToUniversalTime();
        return Runs.FirstOrDefault(r => n >= r.Start && n < r.End);
    }

    public Run? NextRun(DateTime now)
    {
        var cur = CurrentRun(now);
        if (cur is null) return null;
        var i = Runs.ToList().IndexOf(cur);
        return i + 1 < Runs.Count ? Runs[i + 1] : null;
    }

    public List<Run> RunsForDay(DateTime day)
    {
        var startUtc = Kyiv.MidnightUtc(day);
        var endUtc = Kyiv.MidnightUtc(day.AddDays(1));
        var output = new List<Run>();
        foreach (var r in Runs)
        {
            var s = r.Start < startUtc ? startUtc : r.Start;
            var e = r.End > endUtc ? endUtc : r.End;
            if (s < e) output.Add(new Run(s, e, r.Availability));
        }

        return output;
    }

    public List<DateTime> Days() => Slots.Select(s => Kyiv.Day(s.Start)).Distinct().Order().ToList();

    public TimeSpan OffTime(DateTime day) =>
        RunsForDay(day).Where(r => r.Availability == Availability.Off).Aggregate(TimeSpan.Zero, (a, r) => a + r.Length);
}

public record AddressHit(string Number, int GroupNumber, int GroupId);
