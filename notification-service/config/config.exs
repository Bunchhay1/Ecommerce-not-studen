import Config

config :notification_service,
  ecto_repos: [NotificationService.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

# Configures the endpoint
config :notification_service, NotificationServiceWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Phoenix.Endpoint.Cowboy2Adapter,
  render_errors: [
    formats: [json: NotificationServiceWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: NotificationService.PubSub

# Configures Oban for background job queues
config :notification_service, Oban,
  repo: NotificationService.Repo,
  plugins: [Oban.Plugins.Pruner],
  queues: [default: 10, email: 10, push: 10, sms: 5]

# Configures Swoosh Mailer
config :notification_service, NotificationService.Mailer,
  adapter: Swoosh.Adapters.Local

config :swoosh, :api_client, false

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing
config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
