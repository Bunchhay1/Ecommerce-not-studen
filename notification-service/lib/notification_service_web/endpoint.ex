defmodule NotificationServiceWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :notification_service

  plug CORSPlug

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug NotificationServiceWeb.Router
end
