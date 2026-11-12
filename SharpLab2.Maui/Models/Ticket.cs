using System.ComponentModel.DataAnnotations;

namespace SharpLab2.Models;

public class Ticket : IEntity
{
    public int Id { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Будь ласка, оберіть пасажира зі списку.")]
    public int PassengerId { get; set; }
    public Passenger? Passenger { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Будь ласка, оберіть потяг зі списку.")]
    public int TrainId { get; set; }
    public Train? Train { get; set; }

    [Range(1, 30, ErrorMessage = "Номер вагона повинен бути в межах від 1 до 30.")]
    public int CarriageNumber { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Будь ласка, оберіть тип вагона зі списку.")]
    public int CarriageTypeId { get; set; }
    public CarriageType? CarriageType { get; set; }

    [Required(ErrorMessage = "Вкажіть дату відправлення.")]
    [MaxLength(20)]
    public string DepartureDate { get; set; } = string.Empty;

    [Range(0, 10000, ErrorMessage = "Надбавка за терміновість не може бути від'ємною.")]
    public decimal UrgencySurcharge { get; set; }

    public decimal GetTotalPrice()
    {
        return (Train?.Destination?.BaseFare ?? 0) + (CarriageType?.Surcharge ?? 0) + UrgencySurcharge;
    }
}
