using SharpLab2.Maui.Data;
using SharpLab2.Models;

namespace SharpLab2.Data;

public class DatabaseInitializer(AppDbContext context)
{
    public void Initialize()
    {
        context.Database.EnsureCreated();

        if (!context.Passengers.Any())
        {
            SeedData();
        }
    }

    private void SeedData()
    {
        List<Destination> destinations =
        [
            new() { Name = "Львів", DistanceKm = 267, BaseFare = 240.00m },
            new() { Name = "Тернопіль", DistanceKm = 180, BaseFare = 180.00m },
            new() { Name = "Хмельницький", DistanceKm = 210, BaseFare = 200.00m },
            new() { Name = "Вінниця", DistanceKm = 330, BaseFare = 280.00m }
        ];
        context.Destinations.AddRange(destinations);

        List<CarriageType> carriageTypes =
        [
            new() { TypeName = "Загальний", Surcharge = 0.00m },
            new() { TypeName = "Плацкартний", Surcharge = 70.00m },
            new() { TypeName = "Купе", Surcharge = 160.00m },
            new() { TypeName = "Люкс", Surcharge = 400.00m }
        ];
        context.CarriageTypes.AddRange(carriageTypes);

        List<Passenger> passengers =
        [
            new() { FullName = "Коваленко Іван Петрович", Address = "м. Чернівці, вул. Головна, 45", Phone = "+380501112233" },
            new() { FullName = "Мельник Олена Василівна", Address = "м. Чернівці, вул. Героїв Майдану, 12", Phone = "+380672223344" },
            new() { FullName = "Бондаренко Сергій Миколайович", Address = "м. Чернівці, вул. Університетська, 8", Phone = "+380933334455" },
            new() { FullName = "Ткаченко Марія Іванівна", Address = "м. Чернівці, вул. Руська, 103", Phone = "+380504445566" },
            new() { FullName = "Кравченко Андрій Володимирович", Address = "м. Чернівці, вул. Кобилянської, 22", Phone = "+380995556677" }
        ];
        context.Passengers.AddRange(passengers);

        List<Train> trains =
        [
            new() { TrainNumber = "702О", TrainType = "Інтерсіті", Destination = destinations[0], DepartureTime = "06:00", ArrivalTime = "09:45" },
            new() { TrainNumber = "118Ш", TrainType = "Швидкісний", Destination = destinations[3], DepartureTime = "19:45", ArrivalTime = "04:20" },
            new() { TrainNumber = "358Л", TrainType = "Пасажирський", Destination = destinations[1], DepartureTime = "08:20", ArrivalTime = "12:40" }
        ];
        context.Trains.AddRange(trains);

        List<Ticket> tickets =
        [
            new() { Passenger = passengers[0], Train = trains[0], CarriageNumber = 2, CarriageType = carriageTypes[2], DepartureDate = "2026-09-20", UrgencySurcharge = 0.00m },
            new() { Passenger = passengers[0], Train = trains[1], CarriageNumber = 1, CarriageType = carriageTypes[3], DepartureDate = "2026-09-25", UrgencySurcharge = 50.00m },
            new() { Passenger = passengers[1], Train = trains[1], CarriageNumber = 2, CarriageType = carriageTypes[2], DepartureDate = "2026-09-22", UrgencySurcharge = 0.00m },
            new() { Passenger = passengers[1], Train = trains[2], CarriageNumber = 2, CarriageType = carriageTypes[2], DepartureDate = "2026-10-02", UrgencySurcharge = 30.00m },
            new() { Passenger = passengers[2], Train = trains[0], CarriageNumber = 1, CarriageType = carriageTypes[3], DepartureDate = "2026-09-21", UrgencySurcharge = 80.00m },
            new() { Passenger = passengers[2], Train = trains[1], CarriageNumber = 2, CarriageType = carriageTypes[2], DepartureDate = "2026-09-28", UrgencySurcharge = 0.00m },
            new() { Passenger = passengers[2], Train = trains[2], CarriageNumber = 1, CarriageType = carriageTypes[2], DepartureDate = "2026-10-05", UrgencySurcharge = 0.00m },
            new() { Passenger = passengers[3], Train = trains[2], CarriageNumber = 1, CarriageType = carriageTypes[2], DepartureDate = "2026-09-24", UrgencySurcharge = 40.00m },
            new() { Passenger = passengers[3], Train = trains[0], CarriageNumber = 3, CarriageType = carriageTypes[1], DepartureDate = "2026-10-01", UrgencySurcharge = 0.00m },
            new() { Passenger = passengers[4], Train = trains[1], CarriageNumber = 3, CarriageType = carriageTypes[1], DepartureDate = "2026-09-23", UrgencySurcharge = 0.00m },
            new() { Passenger = passengers[4], Train = trains[0], CarriageNumber = 1, CarriageType = carriageTypes[3], DepartureDate = "2026-09-29", UrgencySurcharge = 90.00m }
        ];
        context.Tickets.AddRange(tickets);

        context.SaveChanges();
    }
}
