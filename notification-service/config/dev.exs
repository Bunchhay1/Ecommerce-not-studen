import Config

config :notification_service, NotificationService.Repo,
  username: "notification_user",
  password: "notification_password",
  hostname: "localhost",
  port: 5443,
  database: "notification_db",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :notification_service, NotificationServiceWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 8092],
  check_origin: false,
  code_reloader: false,
  debug_errors: true,
  secret_key_base: "5YVp8WbQJg94hFmZ2sK7wLnXtP1rC6uE0vA3bD8eG4jH9kM1nP5qR7tU3wX6yZ9a"

config :logger, :console, format: "[$level] $message\n"
config :phoenix, :stacktrace_depth, 20
config :phoenix, :plug_init_mode, :runtime
