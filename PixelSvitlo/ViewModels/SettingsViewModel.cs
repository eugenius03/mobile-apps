using System.Windows.Input;
using PixelSvitlo.Services;

namespace PixelSvitlo.ViewModels;

public class SettingsViewModel : ObservableObject
{
    private readonly AppState _state;

    public SettingsViewModel(AppState state)
    {
        _state = state;
        OwnColorCommand = new Command(() => _state.SetPossibleAsOn(false));
        AsOnCommand = new Command(() => _state.SetPossibleAsOn(true));
        BackCommand = new Command(async () => await Shell.Current.GoToAsync(".."));
        ClearCommand = new Command(async () =>
        {
            if (await Views.Dialogs.ConfirmAsync("Видалити всі групи", "Перестати відстежувати всі групи?", "Видалити"))
            {
                _state.ClearAll();
            }
        });
        _state.Changed += () => OnPropertyChanged(string.Empty);
    }

    public ICommand OwnColorCommand { get; }

    public ICommand AsOnCommand { get; }

    public ICommand BackCommand { get; }

    public ICommand ClearCommand { get; }

    public Color OwnColor => _state.PossibleAsOn ? Colors.White : Fmt.Accent;

    public Color AsOnColor => _state.PossibleAsOn ? Fmt.Accent : Colors.White;

    public Color OwnText => _state.PossibleAsOn ? Colors.Black : Colors.White;

    public Color AsOnText => _state.PossibleAsOn ? Colors.White : Colors.Black;

    public bool CanClear => _state.Tracked.Count > 0;
}
