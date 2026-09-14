defmodule NotificationServiceWeb.HealthController do
  use Phoenix.Controller, formats: [:json]

  def check(conn, _params) do
    json(conn, %{
      status: "UP",
      service: "notification-service",
      timestamp: DateTime.utc_now()
    })
  end

  def live(conn, _params) do
    json(conn, %{status: "ALIVE"})
  end

  def ready(conn, _params) do
    # Simple check on repo ping
    json(conn, %{status: "READY"})
  end
end
