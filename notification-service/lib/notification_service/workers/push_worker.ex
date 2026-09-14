defmodule NotificationService.Workers.PushWorker do
  use Oban.Worker, queue: :push, max_attempts: 5

  alias NotificationService.Repo
  alias NotificationService.Deliveries.Delivery
  alias NotificationService.Providers.PushProvider

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"delivery_id" => delivery_id, "token" => token, "title" => title, "body" => body, "data" => data}}) do
    case PushProvider.send_push(token, title, body, data || %{}) do
      {:ok, provider_id} ->
        update_delivery_success(delivery_id, "FCM/APNS", provider_id)
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
          status: "DELIVERED",
          provider: provider,
          provider_message_id: provider_id,
          delivered_at: DateTime.utc_now()
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
