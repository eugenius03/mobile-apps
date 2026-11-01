using Microsoft.Extensions.Logging;
using PixelSvitlo.Services;
using PixelSvitlo.ViewModels;
using PixelSvitlo.Views;

namespace PixelSvitlo;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder.UseMauiApp<App>();

        Microsoft.Maui.Handlers.EntryHandler.Mapper.AppendToMapping("NoChrome", (handler, _) =>
        {
#if IOS || MACCATALYST
            handler.PlatformView.BorderStyle = UIKit.UITextBorderStyle.None;
#elif ANDROID
            handler.PlatformView.Background = null;
#endif
        });

        builder.Services.AddSingleton<OutageApi>();
        builder.Services.AddSingleton<AppState>();

        builder.Services.AddSingleton<HomeViewModel>();
        builder.Services.AddTransient<PickGroupViewModel>();
        builder.Services.AddTransient<DetailViewModel>();
        builder.Services.AddSingleton<SettingsViewModel>();

        builder.Services.AddTransient<HomePage>();
        builder.Services.AddTransient<PickGroupPage>();
        builder.Services.AddTransient<GroupDetailPage>();
        builder.Services.AddTransient<SettingsPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
