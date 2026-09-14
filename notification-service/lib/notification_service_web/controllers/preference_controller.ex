defmodule NotificationServiceWeb.PreferenceController do
  use Phoenix.Controller, formats: [:json]
  alias NotificationService.Notifications

  def show(conn, _params) do
    user_id = conn.assigns[:current_user_id]
    prefs = Notifications.get_user_preferences(user_id)

    response =
      Enum.into(prefs, %{}, fn p ->
        {p.notification_type,
         %{
           email: p.email_enabled,
           push: p.push_enabled,
           sms: p.sms_enabled,
           inApp: p.in_app_enabled
         }}
      end)

    json(conn, %{data: response})
  end

  def update(conn, params) do
    user_id = conn.assigns[:current_user_id]
    Notifications.update_user_preferences(user_id, params)

    json(conn, %{message: "Notification preferences updated successfully"})
  end
end
