defmodule NotificationService.Workers.SmsWorker do
  use Oban.Worker, queue: :sms, max_attempts: 5

  alias NotificationService.Repo
  alias NotificationService.Deliveries.Delivery
  alias NotificationService.Providers.SmsProvider

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"delivery_id" => delivery_id, "phone" => phone, "body" => body}}) do
    case SmsProvider.send_sms(phone, body) do
      {:ok, provider_id} ->
        update_delivery_success(delivery_id, "Twilio/AWS_SNS", provider_id)
        :ok

      {:error, reason} ->
        update_delivery_failure(delivery_id, inspect(reason))
        {:error, reason}
    end
  end

  defp update_delivery_success(delivery_id, provider, provider_id) do
    case Repo.get(Delivery, delivery_id) do
      nil -> :ok
      delivery ->
        delivery
        |> Delivery.changeset(%{
          status: "SENT",
          provider: provider,
          provider_message_id: provider_id,
          sent_at: DateTime.utc_now()
        })
        |> Repo.update()
    end
  end

  defp update_delivery_failure(delivery_id, error) do
    case Repo.get(Delivery, delivery_id) do
      nil -> :ok
      delivery ->
        delivery
        |> Delivery.changeset(%{
          status: "FAILED",
          last_error: error,
          attempt_count: delivery.attempt_count + 1
        })
        |> Repo.update()
    end
  end
end
