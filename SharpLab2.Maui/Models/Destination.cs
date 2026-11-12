using System.ComponentModel.DataAnnotations;

namespace SharpLab2.Models;

public class Destination : IEntity
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Вкажіть назву станції.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 10000, ErrorMessage = "Відстань повинна бути більше 0.")]
    public double DistanceKm { get; set; }

    [Range(0.01, 100000, ErrorMessage = "Базовий тариф повинен бути більше 0.")]
    public decimal BaseFare { get; set; }

    public List<Train> Trains { get; set; } = [];
}
