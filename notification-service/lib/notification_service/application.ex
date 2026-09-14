defmodule NotificationService.Application do
  use Application

  @impl true
  def start(_type, _args) do
    base_children = [
      {Phoenix.PubSub, name: NotificationService.PubSub},
      {Finch, name: NotificationService.Finch}
    ]

    db_children =
      if Application.get_env(:notification_service, :start_repo, true) do
        [
          NotificationService.Repo,
          NotificationServiceWeb.Endpoint,
          {Oban, Application.fetch_env!(:notification_service, Oban)}
        ]
      else
        []
      end

    opts = [strategy: :one_for_one, name: NotificationService.Supervisor]
    Supervisor.start_link(base_children ++ db_children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    NotificationServiceWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
