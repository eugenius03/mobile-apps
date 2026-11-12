using SharpLab2.Maui.Crud;
using SharpLab2.Maui.Pages;

namespace SharpLab2.Maui;

public partial class AppShell : Shell
{
    public AppShell(IEnumerable<IEntityModule> modules)
    {
        InitializeComponent();

        // Permanent sidebar only on desktop; phones get a hamburger flyout.
        if (DeviceInfo.Idiom == DeviceIdiom.Desktop)
        {
            FlyoutBehavior = FlyoutBehavior.Locked;
        }

        foreach (var module in modules)
        {
            Items.Add(new FlyoutItem
            {
                Title = module.Title,
                Items =
                {
                    new ShellContent
                    {
                        Title = module.Title,
                        ContentTemplate = new DataTemplate(() => new EntityListPage(module))
                    }
                }
            });
        }
    }
}
