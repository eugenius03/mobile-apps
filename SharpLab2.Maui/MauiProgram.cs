using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SharpLab2.Data;
using SharpLab2.Maui.Crud;
using SharpLab2.Maui.Data;
using SharpLab2.Models;
using SharpLab2.Services;

namespace SharpLab2.Maui;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

#if DEBUG
        builder.Logging.AddDebug();
#endif

        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "tickets.db");
        builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite($"Data Source={dbPath}"));

        builder.Services
            .AddCrud<Ticket, ITicketService, TicketService>()
            .AddCrud<Passenger, IPassengerService, PassengerService>()
            .AddCrud<Train, ITrainService, TrainService>()
            .AddCrud<Destination, IDestinationService, DestinationService>()
            .AddCrud<CarriageType, ICarriageTypeService, CarriageTypeService>();

        builder.Services.AddSingleton<IEnumerable<IEntityModule>>(sp => Modules.Create(sp));

        var app = builder.Build();

        using (var scope = app.Services.CreateScope())
        {
            new DatabaseInitializer(scope.ServiceProvider.GetRequiredService<AppDbContext>()).Initialize();
        }

        return app;
    }

    private static IServiceCollection AddCrud<T, TService, TImplementation>(this IServiceCollection services)
        where T : class, IEntity
        where TService : class, IBaseService<T>
        where TImplementation : class, TService
    {
        services.AddScoped<TService, TImplementation>();
        services.AddScoped<IBaseService<T>>(sp => sp.GetRequiredService<TService>());
        return services;
    }
}
