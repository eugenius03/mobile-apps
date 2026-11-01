using System.Globalization;
using PixelSvitlo.Models;

namespace PixelSvitlo.ViewModels;

public record RunItem(string Range, string Length, string Icon, Color Color);

public record DayItem(string Title, IDrawable Timeline, IReadOnlyList<RunItem> Runs);

public record GroupItem(OutageGroup Group, string Number, Color Color);

public record MainCardItem(
    int Id, string Title, string SubTitle, bool HasSub, bool Ready, string Message,
    Color Color, string Icon, string Label, string Until, string Next, bool HasNext,
    IDrawable? Timeline, IDrawable? Axis, string DayTitle, bool Stale, bool Loading = false, Color? Tile = null, string Address = "")
{
    public bool NotReady => !Ready;
    public bool ShowSpinner => !Ready && Loading;
    public Color TileColor => Tile ?? Colors.White;
    public bool HasAddress => Address.Length > 0;
    public string AddressLine => "· " + Address;
}

public record GroupRow(int Id, string Title, string SubTitle, bool HasSub, Color Color, string Icon, string State, string Slot, string Address = "")
{
    public bool HasAddress => Address.Length > 0;
    public string AddressLine => "· " + Address;
}

public static class Fmt
{
    public static readonly Color On = Color.FromArgb("#86EFAC");
    public static readonly Color Off = Color.FromArgb("#FCA5A5");
    public static readonly Color Possible = Color.FromArgb("#FDE68A");
    public static readonly Color Accent = Color.FromArgb("#0E7490");
    public static readonly Color Bg = Color.FromArgb("#F1F4F8");

    private static readonly string[] Months = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];
    private static readonly string[] Weekdays = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"];

    public static string Date(DateTime d, bool weekday = false) =>
        (weekday ? $"{Weekdays[(int)d.DayOfWeek]} " : "") + $"{d.Day} {Months[d.Month - 1]}";

    public static string Hm(DateTime utc) => Kyiv.ToKyiv(utc).ToString("HH:mm", CultureInfo.InvariantCulture);

    public static string Dur(TimeSpan d)
    {
        var h = (int)d.TotalHours;
        var m = d.Minutes;
        if (h == 0) return $"{m} хв";
        return m == 0 ? $"{h} год" : $"{h} год {m} хв";
    }

    public static Color AvailColor(Availability a, bool possibleAsOn) => a switch
    {
        Availability.On => On,
        Availability.Off => Off,
        _ => possibleAsOn ? On : Possible,
    };

    public static Color CardColor(Availability a, bool possibleAsOn) =>
        a == Availability.On || (a == Availability.Possible && possibleAsOn) ? Colors.White : AvailColor(a, possibleAsOn);

    public static string AvailLabel(Availability a) => a switch
    {
        Availability.On => "Світло є",
        Availability.Off => "Світла немає",
        _ => "Світло можливе",
    };

    public static string AvailShort(Availability a) => a switch
    {
        Availability.On => "Світло є",
        Availability.Off => "Світла немає",
        _ => "Можливе",
    };

    public static string AvailIcon(Availability a) => a switch
    {
        Availability.On => "zap.svg",
        Availability.Off => "zap_off.svg",
        _ => "hourglass.svg",
    };
}

public class TimelineDrawable(Color?[] cells, int nowIndex) : IDrawable
{
    public void Draw(ICanvas canvas, RectF rect)
    {
        var w = rect.Width / cells.Length;
        for (var i = 0; i < cells.Length; i++)
        {
            canvas.FillColor = cells[i] ?? Fmt.Bg;
            canvas.FillRectangle(rect.X + i * w, rect.Y, w + 0.5f, rect.Height);
        }

        if (nowIndex >= 0 && nowIndex < cells.Length)
        {
            canvas.FillColor = Colors.Black;
            canvas.FillRectangle(rect.X + nowIndex * w, rect.Y, 4, rect.Height);
        }
    }
}

public class AxisDrawable(double startHour, int stepHours) : IDrawable
{
    public void Draw(ICanvas canvas, RectF rect)
    {
        canvas.FontColor = Colors.Black;
        canvas.FontSize = 11;
        canvas.Font = new Microsoft.Maui.Graphics.Font("Courier New", 700);
        var span = 24 - startHour;
        const float pad = 6;
        var inner = rect.Width - 2 * pad;

        void Label(string text, double hour, HorizontalAlignment align)
        {
            var cx = pad + (float)((hour - startHour) / span) * inner;
            const float w = 48;
            var x = align switch
            {
                HorizontalAlignment.Left => cx,
                HorizontalAlignment.Right => cx - w,
                _ => cx - w / 2,
            };
            canvas.DrawString(text, x, rect.Y, w, rect.Height, align, VerticalAlignment.Center);
        }

        var startText = startHour % 1 == 0 ? $"{(int)startHour:00}" : $"{(int)startHour:00}:30";
        Label(startText + (stepHours == 3 ? (startHour % 1 == 0 ? ":00" : "") : ""), startHour, HorizontalAlignment.Left);
        for (var h = stepHours; h < 24; h += stepHours)
        {
            if (h - startHour < 2 || 24 - h < 2) continue;
            Label($"{h:00}", h, HorizontalAlignment.Center);
        }

        Label("24", 24, HorizontalAlignment.Right);
    }
}

public record HouseItem(string Number, string GroupText, AddressHit Hit);
