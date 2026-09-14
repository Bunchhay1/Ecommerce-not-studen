defmodule NotificationService.Providers.SmsProvider do
  require Logger

  @spec send_sms(String.t() | nil, String.t()) :: {:ok, String.t()} | {:error, String.t()}
  def send_sms(nil, _body), do: {:error, "phone number cannot be nil"}
  def send_sms("", _body), do: {:error, "phone number cannot be empty"}
  def send_sms(phone_number, body) do
    masked_phone = String.slice(phone_number, -4..-1)
    Logger.info("[SmsProvider] Sending SMS to '...#{masked_phone}': '#{body}'")
    provider_id = "sms_msg_#{:erlang.unique_integer([:positive])}"
    {:ok, provider_id}
  end
end

