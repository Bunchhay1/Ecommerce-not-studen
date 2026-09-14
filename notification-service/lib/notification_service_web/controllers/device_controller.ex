defmodule NotificationServiceWeb.DeviceController do
  use Phoenix.Controller, formats: [:json]
  alias NotificationService.Notifications

  def create(conn, params) do
    user_id = conn.assigns[:current_user_id]

    case Notifications.register_device(user_id, params) do
      {:ok, device} ->
        conn
        |> put_status(:created)
        |> json(%{
          message: "Device registered successfully",
          deviceId: device.device_id,
          platform: device.platform
        })

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errorCode: "INVALID_DEVICE_TOKEN", message: inspect(changeset.errors)})
    end
  end

  def delete(conn, %{"device_id" => device_id}) do
    user_id = conn.assigns[:current_user_id]

    case Notifications.remove_device(user_id, device_id) do
      {:ok, _} ->
        json(conn, %{message: "Device removed successfully"})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{errorCode: "DEVICE_NOT_FOUND", message: "Device not found"})
    end
  end
end
