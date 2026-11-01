namespace PixelSvitlo;

public class PressFeedbackBehavior : Behavior<View>
{
    private View? _view;
    private TapGestureRecognizer? _tap;

    protected override void OnAttachedTo(View bindable)
    {
        base.OnAttachedTo(bindable);
        _view = bindable;
        _tap = new TapGestureRecognizer();
        _tap.Tapped += OnTapped;
        bindable.GestureRecognizers.Add(_tap);
    }

    protected override void OnDetachingFrom(View bindable)
    {
        if (_tap is not null)
        {
            _tap.Tapped -= OnTapped;
            bindable.GestureRecognizers.Remove(_tap);
        }

        _view = null;
        base.OnDetachingFrom(bindable);
    }

    private async void OnTapped(object? sender, TappedEventArgs e)
    {
        if (_view is not { } v) return;
        await v.ScaleToAsync(0.97, 70, Easing.CubicOut);
        await v.ScaleToAsync(1, 110, Easing.CubicIn);
    }
}
