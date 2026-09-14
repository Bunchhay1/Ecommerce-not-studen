defmodule NotificationService.Providers.EmailProvider do
  require Logger

  @spec send_email(String.t() | nil, String.t(), String.t()) :: {:ok, String.t()} | {:error, String.t()}
  def send_email(nil, _subject, _body), do: {:error, "recipient email cannot be nil"}
  def send_email("", _subject, _body), do: {:error, "recipient email cannot be empty"}
  def send_email(to_address, subject, _body) do
    Logger.info("[EmailProvider] Sending email to '#{to_address}' with subject: '#{subject}'")
    # Simulates provider call with message ID
    provider_id = "email_msg_#{:erlang.unique_integer([:positive])}"
    {:ok, provider_id}
  end
end

