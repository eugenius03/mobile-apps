using System.Windows.Input;

namespace PixelSvitlo.Views;

public class HeaderIconButton : ContentView
{
    public static readonly BindableProperty SourceProperty =
        BindableProperty.Create(nameof(Source), typeof(ImageSource), typeof(HeaderIconButton), null,
            propertyChanged: (b, _, n) => ((HeaderIconButton)b)._icon.Source = (ImageSource?)n);

    public static readonly BindableProperty CommandProperty =
        BindableProperty.Create(nameof(Command), typeof(ICommand), typeof(HeaderIconButton));

    private readonly Image _icon = new()
    {
        WidthRequest = 24,
        HeightRequest = 24,
        HorizontalOptions = LayoutOptions.Center,
        VerticalOptions = LayoutOptions.Center,
    };

    public HeaderIconButton()
    {
        WidthRequest = 44;
        HeightRequest = 44;
        VerticalOptions = LayoutOptions.Center;
        Content = _icon;
        var tap = new TapGestureRecognizer();
        tap.Tapped += async (_, _) =>
        {
            await this.ScaleToAsync(0.85, 60, Easing.CubicOut);
            Command?.Execute(null);
            await this.ScaleToAsync(1, 100, Easing.CubicIn);
        };
        GestureRecognizers.Add(tap);
    }

    public ImageSource? Source { get => (ImageSource?)GetValue(SourceProperty); set => SetValue(SourceProperty, value); }

    public ICommand? Command { get => (ICommand?)GetValue(CommandProperty); set => SetValue(CommandProperty, value); }
}
