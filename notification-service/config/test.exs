import Config

# Do not start live database / endpoint / Oban if Postgres is not running during local unit tests
config :notification_service, :start_repo, false

config :notification_service, NotificationService.Repo,
  username: "notification_user",
  password: "notification_password",
  hostname: "localhost",
  port: 5443,
  database: "notification_test_db",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

config :notification_service, NotificationServiceWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "5YVp8WbQJg94hFmZ2sK7wLnXtP1rC6uE0vA3bD8eG4jH9kM1nP5qR7tU3wX6yZ9a",
  server: false

config :notification_service, Oban, testing: :manual

config :swoosh, :api_client, false
config :logger, level: :warning
config :phoenix, :plug_init_mode, :runtime

