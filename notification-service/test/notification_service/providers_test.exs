defmodule NotificationService.ProvidersTest do
  use ExUnit.Case, async: true
  alias NotificationService.Providers.{EmailProvider, PushProvider, SmsProvider}

  describe "EmailProvider" do
    test "sends email successfully with valid recipient" do
      assert {:ok, id} = EmailProvider.send_email("customer@example.com", "Order Update", "Hello")
      assert is_binary(id)
      assert String.starts_with?(id, "email_msg_")
    end

    test "returns error when recipient is nil or empty" do
      assert {:error, "recipient email cannot be nil"} = EmailProvider.send_email(nil, "Subject", "Body")
      assert {:error, "recipient email cannot be empty"} = EmailProvider.send_email("", "Subject", "Body")
    end
  end

  describe "PushProvider" do
    test "sends push successfully with valid device token" do
      assert {:ok, id} = PushProvider.send_push("fcm_token_123456789", "Order Shipped", "Package is on the way", %{"order_id" => "123"})
      assert is_binary(id)
      assert String.starts_with?(id, "push_msg_")
    end

    test "returns error when token is nil or empty" do
      assert {:error, "push token cannot be nil"} = PushProvider.send_push(nil, "Title", "Body")
      assert {:error, "push token cannot be empty"} = PushProvider.send_push("", "Title", "Body")
    end
  end

  describe "SmsProvider" do
    test "sends SMS successfully with valid phone number" do
      assert {:ok, id} = SmsProvider.send_sms("+15551234567", "Your verification code is 123456")
      assert is_binary(id)
      assert String.starts_with?(id, "sms_msg_")
    end

    test "returns error when phone number is nil or empty" do
      assert {:error, "phone number cannot be nil"} = SmsProvider.send_sms(nil, "Message")
      assert {:error, "phone number cannot be empty"} = SmsProvider.send_sms("", "Message")
    end
  end
end
