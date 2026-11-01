using Microsoft.Maui.Controls.PlatformConfiguration;
using Application = Microsoft.Maui.Controls.Application;
using Microsoft.Maui.Controls.PlatformConfiguration.iOSSpecific;

namespace PixelSvitlo.Views;

public static class Dialogs
{
    public static async Task<bool> ConfirmAsync(string title, string message, string confirmText)
    {
        var page = new DialogPage<bool>(false);
        page.Build(title, message, content: null, buttons:
        [
            new BevelButton { Text = "Скасувати", BaseColor = Color.FromArgb("#E2E8F0"), TextColor = Colors.Black, Command = new Command(() => page.Close(false)) },
            new BevelButton { Text = confirmText, BaseColor = Color.FromArgb("#FCA5A5"), TextColor = Colors.Black, Command = new Command(() => page.Close(true)) },
        ]);
        return await page.ShowAsync();
    }

    private sealed class DialogPage<T>(T cancelValue) : ContentPage
    {
        private readonly TaskCompletionSource<T> _result = new();
        private bool _closed;

        public void Build(string title, string? message, View? content, IReadOnlyList<View> buttons)
        {
            BackgroundColor = Color.FromArgb("#99000000");
            On<iOS>().SetModalPresentationStyle(UIModalPresentationStyle.OverFullScreen);

            var body = new VerticalStackLayout { Spacing = 14 };
            body.Add(new Label { Text = title, FontSize = 20, FontAttributes = FontAttributes.Bold });
            if (message is not null) body.Add(new Label { Text = message, FontSize = 16 });
            if (content is not null) body.Add(content);

            var row = new Grid { ColumnSpacing = 12, Margin = new Thickness(0, 4, 0, 0) };
            for (var i = 0; i < buttons.Count; i++)
            {
                row.AddColumnDefinition(new ColumnDefinition(GridLength.Star));
                Grid.SetColumn(buttons[i], i);
                row.Add(buttons[i]);
            }
            body.Add(row);

            var card = new Border
            {
                Style = (Style)Application.Current!.Resources["PixelCard"],
                Padding = new Thickness(18),
                Margin = new Thickness(24),
                VerticalOptions = LayoutOptions.Center,
                Content = body,
            };
            card.GestureRecognizers.Add(new TapGestureRecognizer());

            var backdrop = new Grid { Children = { card } };
            var dismiss = new TapGestureRecognizer();
            dismiss.Tapped += (_, _) => Close(cancelValue);
            backdrop.GestureRecognizers.Add(dismiss);
            Content = backdrop;
        }

        public async Task<T> ShowAsync()
        {
            await Shell.Current.Navigation.PushModalAsync(this, false);
            return await _result.Task;
        }

        public async void Close(T value)
        {
            if (_closed) return;
            _closed = true;
            try
            {
                // Finish closing before the caller continues, otherwise its own navigation collides with this pop.
                await Shell.Current.Navigation.PopModalAsync(false);
            }
            catch (InvalidOperationException)
            {
            }
            finally
            {
                _result.TrySetResult(value);
            }
        }

        protected override bool OnBackButtonPressed()
        {
            Close(cancelValue);
            return true;
        }
    }
}
