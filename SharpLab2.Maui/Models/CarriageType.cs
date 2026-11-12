using System.ComponentModel.DataAnnotations;

namespace SharpLab2.Models;

public class CarriageType : IEntity
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Вкажіть назву типу вагона.")]
    [MaxLength(50)]
    public string TypeName { get; set; } = string.Empty;

    [Range(0, 100000, ErrorMessage = "Надбавка не може бути від'ємною.")]
    public decimal Surcharge { get; set; }

    public List<Ticket> Tickets { get; set; } = [];
}
