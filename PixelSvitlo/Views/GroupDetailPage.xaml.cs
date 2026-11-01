using System.Globalization;
using PixelSvitlo.ViewModels;

namespace PixelSvitlo.Views;

public partial class GroupDetailPage : ContentPage, IQueryAttributable
{
    private readonly DetailViewModel _vm;

    public GroupDetailPage(DetailViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("id", out var raw) &&
            int.TryParse(Convert.ToString(raw, CultureInfo.InvariantCulture), out var id))
        {
            _vm.Load(id);
        }
    }

    private void OnTitleDoubleTapped(object? sender, TappedEventArgs e)
    {
        _vm.Nickname = _vm.Title;
        TitleRow.IsVisible = false;
        HeaderBar.BackgroundColor = Color.FromArgb("#164E63");
        TitleEntry.IsVisible = true;
        Dispatcher.DispatchDelayed(TimeSpan.FromMilliseconds(120), () =>
        {
            TitleEntry.Focus();
            SelectAll();
        });
    }

    private void SelectAll()
    {
#if IOS || MACCATALYST
        if (TitleEntry.Handler?.PlatformView is UIKit.UITextField field) field.SelectAll(null);
#else
        TitleEntry.CursorPosition = 0;
        TitleEntry.SelectionLength = TitleEntry.Text?.Length ?? 0;
#endif
    }

    private void OnTitleDone(object? sender, EventArgs e)
    {
        if (!TitleEntry.IsVisible) return;
        TitleEntry.IsVisible = false;
        TitleRow.IsVisible = true;
        HeaderBar.BackgroundColor = (Color)Application.Current!.Resources["PixelAccent"];
        if (_vm.Nickname.Trim() == _vm.DefaultName) _vm.Nickname = "";
        _vm.SaveNameCommand.Execute(null);
    }
}
