namespace PaymentService.Exceptions;

public class InvalidPaymentStatusException : Exception
{
    public InvalidPaymentStatusException(string message) : base(message) { }
}
