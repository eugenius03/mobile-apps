using System.Windows.Input;

namespace PixelSvitlo.Views;

public class BevelButton : ContentView
{
    public static readonly BindableProperty TextProperty =
        BindableProperty.Create(nameof(Text), typeof(string), typeof(BevelButton), "", propertyChanged: (b, _, _) => ((BevelButton)b).Sync());

    public static readonly BindableProperty ImageSourceProperty =
        BindableProperty.Create(nameof(ImageSource), typeof(ImageSource), typeof(BevelButton), null, propertyChanged: (b, _, _) => ((BevelButton)b).Sync());

    public static readonly BindableProperty CommandProperty =
        BindableProperty.Create(nameof(Command), typeof(ICommand), typeof(BevelButton));

    public static readonly BindableProperty BaseColorProperty =
        BindableProperty.Create(nameof(BaseColor), typeof(Color), typeof(BevelButton), Color.FromArgb("#0E7490"),
            propertyChanged: (b, _, _) => ((BevelButton)b).Sync());

    public static readonly BindableProperty TextColorProperty =
        BindableProperty.Create(nameof(TextColor), typeof(Color), typeof(BevelButton), Colors.White,
            propertyChanged: (b, _, _) => ((BevelButton)b).Sync());

    public static readonly BindableProperty IconSizeProperty =
        BindableProperty.Create(nameof(IconSize), typeof(double), typeof(BevelButton), 24.0,
            propertyChanged: (b, _, _) => ((BevelButton)b).Sync());

    public static readonly BindableProperty FontSizeProperty =
        BindableProperty.Create(nameof(FontSize), typeof(double), typeof(BevelButton), 16.0,
            propertyChanged: (b, _, _) => ((BevelButton)b).Sync());

    private readonly BevelDrawable _drawable = new();
    private readonly GraphicsView _bg;
    private readonly Image _icon = new() { VerticalOptions = LayoutOptions.Center };
    private readonly Label _label = new() { FontAttributes = FontAttributes.Bold, VerticalOptions = LayoutOptions.Center };
    private readonly HorizontalStackLayout _row = new()
    {
        Spacing = 10,
        HorizontalOptions = LayoutOptions.Center,
        VerticalOptions = LayoutOptions.Center,
    };

    public BevelButton()
    {
        _bg = new GraphicsView { Drawable = _drawable, InputTransparent = true };
        _row.Children.Add(_icon);
        _row.Children.Add(_label);
        _row.Margin = new Thickness(18, 14);
        _row.InputTransparent = true;
        Content = new Grid { Children = { _bg, _row } };

        var tap = new TapGestureRecognizer();
        tap.Tapped += OnTapped;
        GestureRecognizers.Add(tap);
        Sync();
    }

    public string Text { get => (string)GetValue(TextProperty); set => SetValue(TextProperty, value); }

    public ImageSource? ImageSource { get => (ImageSource?)GetValue(ImageSourceProperty); set => SetValue(ImageSourceProperty, value); }

    public ICommand? Command { get => (ICommand?)GetValue(CommandProperty); set => SetValue(CommandProperty, value); }

    public Color BaseColor { get => (Color)GetValue(BaseColorProperty); set => SetValue(BaseColorProperty, value); }

    public Color TextColor { get => (Color)GetValue(TextColorProperty); set => SetValue(TextColorProperty, value); }

    public double IconSize { get => (double)GetValue(IconSizeProperty); set => SetValue(IconSizeProperty, value); }

    public double FontSize { get => (double)GetValue(FontSizeProperty); set => SetValue(FontSizeProperty, value); }

    private void Sync()
    {
        _drawable.Base = BaseColor;
        _bg.Invalidate();
        _label.Text = Text;
        _label.TextColor = TextColor;
        _label.FontSize = FontSize;
        _label.IsVisible = !string.IsNullOrEmpty(Text);
        _icon.Source = ImageSource;
        _icon.IsVisible = ImageSource is not null;
        _icon.WidthRequest = _icon.HeightRequest = IconSize;
    }

    private async void OnTapped(object? sender, TappedEventArgs e)
    {
        if (!IsEnabled) return;
        _drawable.Pressed = true;
        _bg.Invalidate();
        await this.ScaleToAsync(0.97, 60, Easing.CubicOut);
        Command?.Execute(null);
        await this.ScaleToAsync(1, 100, Easing.CubicIn);
        _drawable.Pressed = false;
        _bg.Invalidate();
    }

    protected override void OnPropertyChanged(string? propertyName = null)
    {
        base.OnPropertyChanged(propertyName);
        if (propertyName == nameof(IsEnabled)) Opacity = IsEnabled ? 1 : 0.5;
    }

    private sealed class BevelDrawable : IDrawable
    {
        public Color Base { get; set; } = Colors.Gray;

        public bool Pressed { get; set; }

        public void Draw(ICanvas canvas, RectF rect)
        {
            const float outline = 3, light = 3, dark = 4;
            canvas.FillColor = Colors.Black;
            canvas.FillRectangle(rect);

            var x = rect.X + outline;
            var y = rect.Y + outline;
            var w = rect.Width - 2 * outline;
            var h = rect.Height - 2 * outline;

            var hi = Mix(Base, Colors.White, 0.4f);
            var sh = Mix(Base, Colors.Black, 0.35f);
            var top = Pressed ? sh : hi;
            var bottom = Pressed ? hi : sh;

            canvas.FillColor = Base;
            canvas.FillRectangle(x, y, w, h);
            canvas.FillColor = top;
            canvas.FillRectangle(x, y, w, light);
            canvas.FillRectangle(x, y, light, h);
            canvas.FillColor = bottom;
            canvas.FillRectangle(x, y + h - dark, w, dark);
            canvas.FillRectangle(x + w - dark, y, dark, h);
        }

        private static Color Mix(Color a, Color b, float t) => new(
            a.Red + (b.Red - a.Red) * t,
            a.Green + (b.Green - a.Green) * t,
            a.Blue + (b.Blue - a.Blue) * t);
    }
}
