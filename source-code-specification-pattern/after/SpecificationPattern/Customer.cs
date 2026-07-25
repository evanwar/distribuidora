namespace SpecificationPattern;

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public bool IsActive { get; set; }
    public DateTime DateRegistered { get; set; }
    public decimal TotalSpent { get; set; }
    public string Country { get; set; } = "";
}
