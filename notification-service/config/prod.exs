import Config

config :notification_service, NotificationServiceWeb.Endpoint,
  url: [host: "localhost", port: 8092]

config :logger, level: :info
