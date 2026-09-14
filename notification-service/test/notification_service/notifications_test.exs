defmodule NotificationService.NotificationsTest do
  use ExUnit.Case, async: true
  alias NotificationService.Notifications.Notification
  alias NotificationService.Deliveries.Delivery
  alias NotificationService.Preferences.Preference
  alias NotificationService.Devices.Device
  alias NotificationService.Idempotency.ProcessedEvent

  describe "Notification Changeset" do
    test "validates required fields" do
      changeset = Notification.changeset(%Notification{}, %{})
      refute changeset.valid?
      assert %{title: ["can't be blank"], body: ["can't be blank"], type: ["can't be blank"], user_id: ["can't be blank"]} = errors_on(changeset)
    end

    test "validates valid status and priority" do
      attrs = %{
        user_id: "user-1",
        type: "ORDER_SHIPPED",
        title: "Order Shipped",
        body: "Your order is on the way",
        status: "PENDING",
        priority: "HIGH"
      }
      changeset = Notification.changeset(%Notification{}, attrs)
      assert changeset.valid?
    end

    test "rejects invalid status" do
      attrs = %{
        user_id: "user-1",
        type: "ORDER_SHIPPED",
        title: "Order Shipped",
        body: "Your order is on the way",
        status: "INVALID_STATUS"
      }
      changeset = Notification.changeset(%Notification{}, attrs)
      refute changeset.valid?
      assert %{status: ["is invalid"]} = errors_on(changeset)
    end
  end

  describe "Delivery Changeset" do
    test "validates valid channel and status" do
      attrs = %{
        notification_id: Ecto.UUID.generate(),
        channel: "EMAIL",
        status: "PENDING"
      }
      changeset = Delivery.changeset(%Delivery{}, attrs)
      assert changeset.valid?
    end

    test "rejects invalid channel" do
      attrs = %{
        notification_id: Ecto.UUID.generate(),
        channel: "TELEPATHY"
      }
      changeset = Delivery.changeset(%Delivery{}, attrs)
      refute changeset.valid?
      assert %{channel: ["is invalid"]} = errors_on(changeset)
    end
  end

  describe "Preference Changeset" do
    test "sets default channel booleans correctly" do
      attrs = %{
        user_id: "user-1",
        notification_type: "ORDER_UPDATE",
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true
      }
      changeset = Preference.changeset(%Preference{}, attrs)
      assert changeset.valid?
    end
  end

  describe "Device Changeset" do
    test "validates supported mobile/web platforms" do
      attrs = %{
        user_id: "user-1",
        device_id: "iphone-12",
        platform: "IOS",
        push_token: "fcm_token_sample"
      }
      changeset = Device.changeset(%Device{}, attrs)
      assert changeset.valid?
    end

    test "rejects unsupported platform" do
      attrs = %{
        user_id: "user-1",
        device_id: "dev-1",
        platform: "WINDOWS_PHONE",
        push_token: "token"
      }
      changeset = Device.changeset(%Device{}, attrs)
      refute changeset.valid?
      assert %{platform: ["is invalid"]} = errors_on(changeset)
    end
  end

  describe "ProcessedEvent Changeset" do
    test "validates event_id and event_type" do
      attrs = %{
        event_id: "evt-001",
        event_type: "OrderPaid",
        processed_at: DateTime.utc_now()
      }
      changeset = ProcessedEvent.changeset(%ProcessedEvent{}, attrs)
      assert changeset.valid?
    end
  end

  defp errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
