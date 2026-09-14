ExUnit.start()

if Application.get_env(:notification_service, :start_repo, true) do
  Ecto.Adapters.SQL.Sandbox.mode(NotificationService.Repo, :manual)
end

