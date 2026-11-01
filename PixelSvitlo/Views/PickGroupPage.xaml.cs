using PixelSvitlo.ViewModels;

namespace PixelSvitlo.Views;

public partial class PickGroupPage : ContentPage
{
    private readonly PickGroupViewModel _vm;

    public PickGroupPage(PickGroupViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
        _vm.DistrictChosen += () =>
        {
            DistrictEntry.Unfocus();
            DistrictEntry.Text = _vm.District;
        };
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.LoadAsync();
        await _vm.LoadDistrictsAsync();
    }

    private void OnDistrictFocused(object? sender, FocusEventArgs e)
    {
        _vm.OpenDistricts();
        if (sender is Entry entry)
        {
            Dispatcher.DispatchDelayed(TimeSpan.FromMilliseconds(80), () =>
            {
                entry.CursorPosition = 0;
                entry.SelectionLength = entry.Text?.Length ?? 0;
            });
        }
    }

    private void OnDistrictUnfocused(object? sender, FocusEventArgs e) =>
        Dispatcher.DispatchDelayed(TimeSpan.FromMilliseconds(250), _vm.CommitDistrict);
}
