namespace PaymentService.Exceptions;

public class DuplicatePaymentException : Exception
{
    public DuplicatePaymentException(string message) : base(message) { }
}
