namespace PaymentService.DTOs;

public class PageResponse<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; } = 1;
    public int Size { get; set; } = 20;
    public long Total { get; set; }
    public int TotalPages => Size > 0 ? (int)Math.Ceiling((double)Total / Size) : 0;
}
