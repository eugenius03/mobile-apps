using SharpLab2.Maui.Crud;

namespace SharpLab2.Maui;

public partial class App(IEnumerable<IEntityModule> modules) : Application
{
    protected override Window CreateWindow(IActivationState? activationState)
    {
        InitializeComponent();
        return new Window(new AppShell(modules));
    }
}
