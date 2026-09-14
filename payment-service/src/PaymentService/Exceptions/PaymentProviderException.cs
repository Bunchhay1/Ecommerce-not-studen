namespace PaymentService.Exceptions;

public class PaymentProviderException : Exception
{
    public string? Provider { get; }
    public string? ErrorCode { get; }

    public PaymentProviderException(string message, string? provider = null, string? errorCode = null) 
        : base(message)
    {
        Provider = provider;
        ErrorCode = errorCode;
    }
}
