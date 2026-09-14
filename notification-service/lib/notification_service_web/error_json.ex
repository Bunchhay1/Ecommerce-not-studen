defmodule NotificationServiceWeb.ErrorJSON do
  def render(template, _assigns) do
    %{errors: %{detail: Phoenix.Controller.status_message_from_template(template)}}
  end

  def error(%{code: code, message: message}) do
    %{errorCode: code, message: message}
  end
end
