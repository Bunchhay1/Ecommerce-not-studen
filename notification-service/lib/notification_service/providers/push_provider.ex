defmodule NotificationService.Providers.PushProvider do
  require Logger

  @spec send_push(String.t() | nil, String.t(), String.t(), map()) :: {:ok, String.t()} | {:error, String.t()}
  def send_push(token, title, body, data \\ %{})
  def send_push(nil, _title, _body, _data), do: {:error, "push token cannot be nil"}
  def send_push("", _title, _body, _data), do: {:error, "push token cannot be empty"}
  def send_push(token, title, _body, _data) do
    masked_token = String.slice(token, 0..8) <> "..."
    Logger.info("[PushProvider] Sending push notification to token '#{masked_token}': '#{title}'")
    provider_id = "push_msg_#{:erlang.unique_integer([:positive])}"
    {:ok, provider_id}
  end
end

