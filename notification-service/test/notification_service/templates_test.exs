defmodule NotificationService.TemplatesTest do
  use ExUnit.Case, async: true
  alias NotificationService.Templates.TemplateEngine

  describe "TemplateEngine.render/2" do
    test "replaces mustache tokens with values" do
      template = "Hello {{user_name}}, your order {{order_number}} is confirmed!"
      data = %{"user_name" => "Alice", "order_number" => "ORD-1234"}

      result = TemplateEngine.render(template, data)
      assert result == "Hello Alice, your order ORD-1234 is confirmed!"
    end

    test "handles atom keys in data map" do
      template = "Payment of {{amount}} {{currency}} received."
      data = %{amount: "150.00", currency: "USD"}

      result = TemplateEngine.render(template, data)
      assert result == "Payment of 150.00 USD received."
    end

    test "replaces missing keys with empty string" do
      template = "Tracking: {{tracking_number}}."
      data = %{}

      result = TemplateEngine.render(template, data)
      assert result == "Tracking: ."
    end

    test "returns empty string when template is nil" do
      assert TemplateEngine.render(nil, %{}) == ""
    end
  end

  describe "TemplateEngine.default_template/2" do
    test "provides default template for ORDER_CONFIRMED" do
      {subject, body} = TemplateEngine.default_template("ORDER_CONFIRMED", "EMAIL")
      assert subject =~ "Order Confirmed"
      assert body =~ "{{order_number}}"
    end

    test "provides default template for ORDER_SHIPPED push notification" do
      {title, body} = TemplateEngine.default_template("ORDER_SHIPPED", "PUSH")
      assert title == "Order Shipped"
      assert body =~ "{{order_number}}"
    end
  end
end
