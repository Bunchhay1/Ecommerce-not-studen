namespace PaymentService.Exceptions;

public class PaymentNotFoundException : Exception
{
    public PaymentNotFoundException(string message) : base(message) { }
    public PaymentNotFoundException(Guid id) : base($"Payment with ID '{id}' was not found.") { }
}
