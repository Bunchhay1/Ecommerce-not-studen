defmodule NotificationService.Templates.TemplateEngine do
  @doc """
  Replaces mustache tokens like {{user_name}} with values from the data map.
  Keys in data map can be strings or atoms.
  """
  def render(nil, _data), do: ""

  def render(template_str, data) when is_binary(template_str) and is_map(data) do
    Regex.replace(~r/{{\s*([a-zA-Z0-9_]+)\s*}}/, template_str, fn _, key ->
      val = Map.get(data, key) || Map.get(data, String.to_atom(key)) || ""
      to_string(val)
    end)
  end

  def default_template(code, channel) do
    case {code, channel} do
      {"ORDER_CONFIRMED", "EMAIL"} ->
        {"Order Confirmed: {{order_number}}", "Hello {{user_name}}, your order {{order_number}} for {{total}} {{currency}} has been confirmed."}

      {"PAYMENT_SUCCESS", "EMAIL"} ->
        {"Payment Successful", "Hello {{user_name}}, payment for order {{order_number}} was successful."}

      {"PAYMENT_FAILED", "EMAIL"} ->
        {"Payment Failed", "Hello {{user_name}}, payment for order {{order_number}} failed. Please update your payment method."}

      {"ORDER_SHIPPED", "EMAIL"} ->
        {"Your order {{order_number}} has shipped!", "Hello {{user_name}}, your order has shipped with tracking number: {{tracking_number}}."}

      {"ORDER_SHIPPED", "PUSH"} ->
        {"Order Shipped", "Your package {{order_number}} is on the way!"}

      {"ORDER_DELIVERED", "PUSH"} ->
        {"Order Delivered 📦", "Your order {{order_number}} has been delivered."}

      {_code, _channel} ->
        {"Notification", "{{body}}"}
    end
  end
end
