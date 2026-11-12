using System.ComponentModel.DataAnnotations;

namespace SharpLab2.Models;

public class Train : IEntity
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Вкажіть номер потяга.")]
    [MaxLength(20)]
    public string TrainNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Вкажіть тип потяга.")]
    [MaxLength(50)]
    public string TrainType { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Будь ласка, оберіть станцію призначення зі списку.")]
    public int DestinationId { get; set; }
    public Destination? Destination { get; set; }

    [Required(ErrorMessage = "Вкажіть час відправлення.")]
    [MaxLength(10)]
    public string DepartureTime { get; set; } = string.Empty;

    [Required(ErrorMessage = "Вкажіть час прибуття.")]
    [MaxLength(10)]
    public string ArrivalTime { get; set; } = string.Empty;

    public List<Ticket> Tickets { get; set; } = [];
}
