using System.ComponentModel.DataAnnotations;

namespace SharpLab2.Models;

public class Passenger : IEntity
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Вкажіть ПІБ пасажира.")]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Вкажіть адресу пасажира.")]
    [MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    [Required(ErrorMessage = "Вкажіть номер телефону.")]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    public List<Ticket> Tickets { get; set; } = [];
}
