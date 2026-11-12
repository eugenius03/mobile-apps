using SharpLab2.Models;

namespace SharpLab2.Maui.Crud;

public static class Modules
{
    public static List<IEntityModule> Create(IServiceProvider services) =>
    [
        new EntityModule<Ticket>(services, "Квитки",
            t => $"№{t.Id} {t.Passenger?.FullName}",
            t => $"Поїзд {t.Train?.TrainNumber} → {t.Train?.Destination?.Name}\n" +
                 $"Вагон №{t.CarriageNumber} ({t.CarriageType?.TypeName}), {DateText.ToDisplay(t.DepartureDate)}\n" +
                 $"До сплати: {t.GetTotalPrice():F2} грн",
            () =>
            [
                new PickerField<Ticket, Passenger>("Пасажир", t => t.PassengerId, (t, v) => t.PassengerId = v, p => $"{p.FullName} ({p.Phone})"),
                new PickerField<Ticket, Train>("Потяг", t => t.TrainId, (t, v) => t.TrainId = v, tr => $"№{tr.TrainNumber} ({tr.TrainType}) - {tr.Destination?.Name}"),
                new PickerField<Ticket, CarriageType>("Тип вагона", t => t.CarriageTypeId, (t, v) => t.CarriageTypeId = v, c => $"{c.TypeName} (+{c.Surcharge:N2} грн)"),
                new NumberField<Ticket, int>("Номер вагона (1-30)", t => t.CarriageNumber == 0 ? 1 : t.CarriageNumber, (t, v) => t.CarriageNumber = v),
                new DateField<Ticket>("Дата відправлення", t => t.DepartureDate, (t, v) => t.DepartureDate = v),
                new NumberField<Ticket, decimal>("Надбавка за терміновість (грн)", t => t.UrgencySurcharge, (t, v) => t.UrgencySurcharge = v)
            ]),

        new EntityModule<Passenger>(services, "Пасажири",
            p => p.FullName,
            p => $"{p.Phone}\n{p.Address}\nКвитків: {p.Tickets.Count}",
            () =>
            [
                new TextField<Passenger>("ПІБ", p => p.FullName, (p, v) => p.FullName = v),
                new TextField<Passenger>("Адреса", p => p.Address, (p, v) => p.Address = v),
                new TextField<Passenger>("Телефон", p => p.Phone, (p, v) => p.Phone = v)
            ]),

        new EntityModule<Train>(services, "Потяги",
            t => $"№{t.TrainNumber} ({t.TrainType})",
            t => $"{t.Destination?.Name}\n{t.DepartureTime} – {t.ArrivalTime}",
            () =>
            [
                new TextField<Train>("Номер потяга", t => t.TrainNumber, (t, v) => t.TrainNumber = v),
                new TextField<Train>("Тип потяга", t => t.TrainType, (t, v) => t.TrainType = v),
                new PickerField<Train, Destination>("Станція призначення", t => t.DestinationId, (t, v) => t.DestinationId = v, d => d.Name),
                new TextField<Train>("Час відправлення", t => t.DepartureTime, (t, v) => t.DepartureTime = v),
                new TextField<Train>("Час прибуття", t => t.ArrivalTime, (t, v) => t.ArrivalTime = v)
            ]),

        new EntityModule<Destination>(services, "Напрямки",
            d => d.Name,
            d => $"{d.DistanceKm} км, базовий тариф {d.BaseFare:F2} грн",
            () =>
            [
                new TextField<Destination>("Назва станції", d => d.Name, (d, v) => d.Name = v),
                new NumberField<Destination, double>("Відстань (км)", d => d.DistanceKm, (d, v) => d.DistanceKm = v),
                new NumberField<Destination, decimal>("Базовий тариф (грн)", d => d.BaseFare, (d, v) => d.BaseFare = v)
            ]),

        new EntityModule<CarriageType>(services, "Типи вагонів",
            c => c.TypeName,
            c => $"Надбавка: {c.Surcharge:F2} грн",
            () =>
            [
                new TextField<CarriageType>("Назва типу", c => c.TypeName, (c, v) => c.TypeName = v),
                new NumberField<CarriageType, decimal>("Надбавка (грн)", c => c.Surcharge, (c, v) => c.Surcharge = v)
            ])
    ];
}
