defmodule NotificationServiceWeb.NotificationController do
  use Phoenix.Controller, formats: [:json]
  alias NotificationService.Notifications

  def index(conn, params) do
    user_id = conn.assigns[:current_user_id]
    result = Notifications.list_user_notifications(user_id, params)

    json(conn, %{
      data: Enum.map(result.notifications, &serialize/1),
      pagination: %{
        page: result.page,
        limit: result.limit,
        total: result.total
      }
    })
  end

  def show(conn, %{"id" => id}) do
    user_id = conn.assigns[:current_user_id]

    case Notifications.get_user_notification(id, user_id) do
      {:ok, notification} ->
        json(conn, %{data: serialize(notification)})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{errorCode: "NOTIFICATION_NOT_FOUND", message: "Notification not found"})
    end
  end

  def mark_as_read(conn, %{"id" => id}) do
    user_id = conn.assigns[:current_user_id]

    case Notifications.mark_as_read(id, user_id) do
      {:ok, notification} ->
        json(conn, %{data: serialize(notification)})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{errorCode: "NOTIFICATION_NOT_FOUND", message: "Notification not found"})
    end
  end

  def mark_all_as_read(conn, _params) do
    user_id = conn.assigns[:current_user_id]
    {:ok, count} = Notifications.mark_all_as_read(user_id)
    json(conn, %{message: "All notifications marked as read", updatedCount: count})
  end

  def delete(conn, %{"id" => id}) do
    user_id = conn.assigns[:current_user_id]

    case Notifications.delete_notification(id, user_id) do
      {:ok, _notification} ->
        json(conn, %{message: "Notification deleted successfully"})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{errorCode: "NOTIFICATION_NOT_FOUND", message: "Notification not found"})
    end
  end

  defp serialize(notification) do
    %{
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      status: notification.status,
      priority: notification.priority,
      readAt: notification.read_at,
      createdAt: notification.inserted_at
    }
  end
end
