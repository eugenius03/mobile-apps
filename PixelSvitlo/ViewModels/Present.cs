using PixelSvitlo.Models;
using PixelSvitlo.Services;

namespace PixelSvitlo.ViewModels;

public static class Present
{
    public static string DayLabel(DateTime day) => Fmt.Date(day, weekday: true);

    public static string DayTitle(Schedule schedule, DateTime day)
    {
        var off = schedule.OffTime(day);
        return $"{DayLabel(day)} · {(off == TimeSpan.Zero ? "без відключень" : $"{Fmt.Dur(off)} без світла")}";
    }

    public static int NowSlot(DateTime day)
    {
        var minutes = (DateTime.UtcNow - Kyiv.MidnightUtc(day)).TotalMinutes;
        return Math.Clamp((int)Math.Floor(minutes / 30), 0, 47);
    }

    public static TimelineDrawable Timeline(Schedule schedule, DateTime day, bool asOn, int from = 0)
    {
        var runs = schedule.RunsForDay(day);
        var start = Kyiv.MidnightUtc(day);
        var nowUtc = DateTime.UtcNow;
        var cells = new Color?[48 - from];
        var nowIndex = -1;
        for (var i = from; i < 48; i++)
        {
            var t = start.AddMinutes(30 * i);
            var run = runs.FirstOrDefault(r => t >= r.Start && t < r.End);
            cells[i - from] = run is null ? null : Fmt.AvailColor(run.Availability, asOn);
            if (nowUtc >= t && nowUtc < t.AddMinutes(30)) nowIndex = i - from;
        }

        return new TimelineDrawable(cells, nowIndex);
    }

    private static string RestOfDayTitle(Schedule schedule, DateTime day, int from)
    {
        var startUtc = Kyiv.MidnightUtc(day).AddMinutes(30 * from);
        var off = TimeSpan.Zero;
        foreach (var r in schedule.RunsForDay(day).Where(r => r.Availability == Availability.Off))
        {
            var s = r.Start > startUtc ? r.Start : startUtc;
            if (r.End > s) off += r.End - s;
        }

        return $"Решта дня · {(off == TimeSpan.Zero ? "без відключень" : $"{Fmt.Dur(off)} без світла")}";
    }

    public static List<DayItem> Days(Schedule schedule, bool asOn)
    {
        var list = new List<DayItem>();
        foreach (var day in schedule.Days())
        {
            var items = schedule.RunsForDay(day).Where(r => r.Availability != Availability.On)
                .Select(r => new RunItem(
                    $"{Fmt.Hm(r.Start)} – {Fmt.Hm(r.End)}",
                    Fmt.Dur(r.Length),
                    Fmt.AvailIcon(r.Availability),
                    Fmt.AvailColor(r.Availability, asOn)))
                .ToList();
            var title = items.Count > 0 ? $"Відключення · {DayLabel(day)}" : $"{DayLabel(day)} · без відключень";
            list.Add(new DayItem(title, Timeline(schedule, day, asOn), items));
        }

        return list;
    }

    public static MainCardItem Card(TrackedGroup g, GroupData d, bool asOn, bool futureOnly = false)
    {
        MainCardItem Msg(string m, bool loading = false) => new(g.Id, g.Name, g.SubName, g.SubName.Length > 0, false, m,
            Colors.White, "", "", "", "", false, null, null, "", d.Stale, loading, null, g.Address);

        if (d.Schedule is null)
        {
            return d.Status == LoadStatus.Error ? Msg(d.Error ?? "Щось пішло не так.") : Msg("Перевіряємо мережу…", true);
        }

        if (d.Schedule.IsEmpty) return Msg("Для цієї групи немає даних.");

        var now = DateTime.Now;
        var cur = d.Schedule.CurrentRun(now);
        if (cur is null) return Msg("Зараз поза опублікованим графіком.");

        var next = d.Schedule.NextRun(now);
        var today = Kyiv.Day(DateTime.UtcNow);
        var from = futureOnly ? NowSlot(today) : 0;
        var until = next is null
            ? cur.Availability switch
            {
                Availability.Off => "Час увімкнення ще не опубліковано",
                Availability.On => "Наступне відключення ще не опубліковано",
                _ => "Наступну зміну ще не опубліковано",
            }
            : $"До {Fmt.Hm(cur.End)} · лишилось {Fmt.Dur(cur.End - now.ToUniversalTime())}";
        return new MainCardItem(
            g.Id, g.Name, g.SubName, g.SubName.Length > 0, true, "",
            Fmt.CardColor(cur.Availability, asOn), Fmt.AvailIcon(cur.Availability), Fmt.AvailLabel(cur.Availability),
            until,
            next is null ? "" : $"Далі: {Fmt.AvailLabel(next.Availability).ToLowerInvariant()} {Fmt.Hm(next.Start)}–{Fmt.Hm(next.End)}",
            next is not null,
            Timeline(d.Schedule, today, asOn, from),
            new AxisDrawable(from / 2.0, futureOnly ? 3 : 6),
            futureOnly ? RestOfDayTitle(d.Schedule, today, from) : DayTitle(d.Schedule, today),
            d.Stale, false, Fmt.AvailColor(cur.Availability, asOn), g.Address);
    }

    public static GroupRow Row(TrackedGroup g, GroupData d, bool asOn)
    {
        GroupRow Plain(string state) => new(g.Id, g.Name, g.SubName, g.SubName.Length > 0, Colors.White, "", state, "", g.Address);

        if (d.Schedule is null)
        {
            return Plain(d.Status == LoadStatus.Error ? "Немає даних" : "Завантаження…");
        }

        var now = DateTime.Now;
        var cur = d.Schedule.CurrentRun(now);
        if (cur is null) return Plain("Зараз немає даних");
        var next = d.Schedule.NextRun(now);
        return new GroupRow(
            g.Id, g.Name, g.SubName, g.SubName.Length > 0,
            Fmt.AvailColor(cur.Availability, asOn), Fmt.AvailIcon(cur.Availability),
            Fmt.AvailShort(cur.Availability),
            next is null ? $"· з {Fmt.Hm(cur.Start)}" : $"· {Fmt.Hm(cur.Start)}–{Fmt.Hm(cur.End)}",
            g.Address);
    }
}
