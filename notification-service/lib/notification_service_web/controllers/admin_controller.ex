defmodule NotificationServiceWeb.AdminController do
  use Phoenix.Controller, formats: [:json]
  alias NotificationService.Notifications
  alias NotificationService.Repo
  alias NotificationService.Deliveries.Delivery
  import Ecto.Query

  def list_templates(conn, _params) do
    templates = Notifications.list_templates()

    json(conn, %{
      data:
        Enum.map(templates, fn t ->
          %{
            id: t.id,
            code: t.code,
            channel: t.channel,
            subject: t.subject,
            body: t.body,
            language: t.language,
            status: t.status
          }
        end)
    })
  end

  def create_template(conn, params) do
    case Notifications.create_template(params) do
      {:ok, template} ->
        conn
        |> put_status(:created)
        |> json(%{message: "Template created", id: template.id, code: template.code})

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errorCode: "INVALID_TEMPLATE", message: inspect(changeset.errors)})
    end
  end

  def list_deliveries(conn, params) do
    limit = Map.get(params, "limit", "50") |> String.to_integer()
    deliveries = Repo.all(from d in Delivery, order_by: [desc: d.inserted_at], limit: ^limit)

    json(conn, %{
      data:
        Enum.map(deliveries, fn d ->
          %{
            id: d.id,
            notificationId: d.notification_id,
            channel: d.channel,
            provider: d.provider,
            status: d.status,
            attemptCount: d.attempt_count,
            lastError: d.last_error,
            sentAt: d.sent_at,
            deliveredAt: d.delivered_at
          }
        end)
    })
  end
end
