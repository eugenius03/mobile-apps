using SharpLab2.Maui.Crud;

namespace SharpLab2.Maui.Pages;

public class EntityFormPage : ContentPage
{
    private readonly IEntityModule _module;
    private readonly int? _id;
    private readonly Label _errors = new() { TextColor = Colors.Crimson, IsVisible = false };
    private readonly VerticalStackLayout _body = new() { Spacing = 8, Padding = 16, MaximumWidthRequest = 640 };
    private EntityForm? _form;

    public EntityFormPage(IEntityModule module, int? id)
    {
        _module = module;
        _id = id;
        Title = id is null ? $"{module.Title}: створення" : $"{module.Title}: редагування";
        Content = new ScrollView { Content = _body };
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        if (_form is not null)
        {
            return;
        }

        _form = await _module.OpenFormAsync(_id);

        var save = new Button { Text = "Зберегти", Margin = new Thickness(0, 16, 0, 0) };
        save.Clicked += OnSaveClicked;
        var cancel = new Button { Text = "Скасувати", BackgroundColor = Colors.Gray };
        cancel.Clicked += async (_, _) => await Navigation.PopAsync();

        _body.Add(_errors);
        _body.Add(_form.Content);
        _body.Add(save);
        _body.Add(cancel);
    }

    private async void OnSaveClicked(object? sender, EventArgs e)
    {
        List<string> errors;
        try
        {
            errors = await _form!.SaveAsync();
        }
        catch (Exception ex)
        {
            errors = [ex.GetBaseException().Message];
        }

        _errors.IsVisible = errors.Count > 0;
        _errors.Text = string.Join("\n", errors);

        if (errors.Count == 0)
        {
            await Navigation.PopAsync();
        }
    }
}
