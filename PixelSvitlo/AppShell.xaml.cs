namespace PixelSvitlo;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();
        Routing.RegisterRoute("pick", typeof(Views.PickGroupPage));
        Routing.RegisterRoute("detail", typeof(Views.GroupDetailPage));
        Routing.RegisterRoute("settings", typeof(Views.SettingsPage));
    }
}
