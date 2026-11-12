using SharpLab2.Maui.Crud;

namespace SharpLab2.Maui.Pages;

public partial class EntityListPage : ContentPage
{
    private readonly IEntityModule _module;

    public EntityListPage(IEntityModule module)
    {
        InitializeComponent();
        _module = module;
        Title = module.Title;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await ReloadAsync();
    }

    private async Task ReloadAsync() => Items.ItemsSource = await _module.LoadAsync(SearchBar.Text);

    private async void OnSearchChanged(object? sender, TextChangedEventArgs e) => await ReloadAsync();

    private async void OnAddClicked(object? sender, EventArgs e) =>
        await Navigation.PushAsync(new EntityFormPage(_module, null));

    private async void OnEditClicked(object? sender, EventArgs e)
    {
        if (RowOf(sender) is { } row)
        {
            await Navigation.PushAsync(new EntityFormPage(_module, row.Id));
        }
    }

    private async void OnDeleteClicked(object? sender, EventArgs e)
    {
        if (RowOf(sender) is not { } row
            || !await DisplayAlertAsync("Підтвердження видалення", $"Видалити «{row.Primary}»?", "Видалити", "Скасувати"))
        {
            return;
        }

        try
        {
            await _module.DeleteAsync(row.Id);
        }
        catch (Exception ex)
        {
            await DisplayAlertAsync("Помилка", ex.GetBaseException().Message, "OK");
        }

        await ReloadAsync();
    }

    private static EntityRow? RowOf(object? sender) => (sender as BindableObject)?.BindingContext as EntityRow;
}
