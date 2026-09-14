defmodule NotificationServiceWeb.Router do
  use Phoenix.Router

  pipeline :api do
    plug :accepts, ["json"]
    plug NotificationServiceWeb.Plugs.AuthPlug
  end

  pipeline :public do
    plug :accepts, ["json"]
  end

  scope "/health", NotificationServiceWeb do
    pipe_through :public
    get "/", HealthController, :check
    get "/live", HealthController, :live
    get "/ready", HealthController, :ready
  end

  scope "/api/v1", NotificationServiceWeb do
    pipe_through :api

    # Notifications
    get "/notifications", NotificationController, :index
    post "/notifications/read-all", NotificationController, :mark_all_as_read
    get "/notifications/:id", NotificationController, :show
    post "/notifications/:id/read", NotificationController, :mark_as_read
    delete "/notifications/:id", NotificationController, :delete

    # Notification Preferences
    get "/notification-preferences", PreferenceController, :show
    put "/notification-preferences", PreferenceController, :update

    # Devices
    post "/devices", DeviceController, :create
    delete "/devices/:device_id", DeviceController, :delete

    # Admin
    get "/admin/templates", AdminController, :list_templates
    post "/admin/templates", AdminController, :create_template
    get "/admin/deliveries", AdminController, :list_deliveries
  end
end
