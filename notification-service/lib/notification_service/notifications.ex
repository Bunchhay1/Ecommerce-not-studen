defmodule NotificationService.Notifications do
  import Ecto.Query, warn: false
  alias NotificationService.Repo
  alias NotificationService.Notifications.Notification
  alias NotificationService.Deliveries.Delivery
  alias NotificationService.Templates.{Template, TemplateEngine}
  alias NotificationService.Preferences.Preference
  alias NotificationService.Devices.Device
  alias NotificationService.Idempotency.ProcessedEvent
  alias NotificationService.Workers.{EmailWorker, PushWorker, SmsWorker}
  require Logger

  # -------------------------------------------------------------
  # Notifications
  # -------------------------------------------------------------

  def list_user_notifications(user_id, params \\ %{}) do
    page = Map.get(params, "page", 1) |> to_int(1)
    limit = Map.get(params, "limit", 20) |> to_int(20)
    offset = (page - 1) * limit

    query =
      from n in Notification,
        where: n.user_id == ^user_id and n.status != "CANCELLED",
        order_by: [desc: n.inserted_at],
        limit: ^limit,
        offset: ^offset

    total =
      Repo.one(
        from n in Notification,
          where: n.user_id == ^user_id and n.status != "CANCELLED",
          select: count(n.id)
      )

    notifications = Repo.all(query)
    %{notifications: notifications, total: total, page: page, limit: limit}
  end

  def get_user_notification(id, user_id) do
    case Repo.get_by(Notification, id: id, user_id: user_id) do
      nil -> {:error, :not_found}
      notification -> {:ok, notification}
    end
  end

  def create_notification(attrs) do
    %Notification{}
    |> Notification.changeset(attrs)
    |> Repo.insert()
  end

  def mark_as_read(id, user_id) do
    case get_user_notification(id, user_id) do
      {:ok, notification} ->
        notification
        |> Notification.changeset(%{status: "READ", read_at: DateTime.utc_now()})
        |> Repo.update()

      error ->
        error
    end
  end

  def mark_all_as_read(user_id) do
    now = DateTime.utc_now()

    {count, _} =
      from(n in Notification,
        where: n.user_id == ^user_id and n.status in ["PENDING", "SENT", "DELIVERED"]
      )
      |> Repo.update_all(set: [status: "READ", read_at: now])

    {:ok, count}
  end

  def delete_notification(id, user_id) do
    case get_user_notification(id, user_id) do
      {:ok, notification} ->
        notification
        |> Notification.changeset(%{status: "CANCELLED"})
        |> Repo.update()

      error ->
        error
    end
  end

  # -------------------------------------------------------------
  # Multi-Channel Dispatching & Background Jobs (Oban)
  # -------------------------------------------------------------

  def dispatch(notification, user_email \\ nil, user_phone \\ nil) do
    prefs = get_or_create_preferences(notification.user_id, notification.type)

    # 1. Email Channel
    if prefs.email_enabled && user_email do
      dispatch_channel(notification, "EMAIL", fn delivery ->
        {subject_tmpl, body_tmpl} = get_template(notification.type, "EMAIL")
        data = Map.put(notification.data || %{}, "title", notification.title)
        rendered_subject = TemplateEngine.render(subject_tmpl, data)
        rendered_body = TemplateEngine.render(body_tmpl, data)

        %{delivery_id: delivery.id, to: user_email, subject: rendered_subject, body: rendered_body}
        |> EmailWorker.new()
        |> Oban.insert()
      end)
    end

    # 2. Push Channel
    if prefs.push_enabled do
      devices = list_user_devices(notification.user_id)
      for device <- devices do
        dispatch_channel(notification, "PUSH", fn delivery ->
          %{
            delivery_id: delivery.id,
            token: device.push_token,
            title: notification.title,
            body: notification.body,
            data: notification.data
          }
          |> PushWorker.new()
          |> Oban.insert()
        end)
      end
    end

    # 3. SMS Channel
    if prefs.sms_enabled && user_phone do
      dispatch_channel(notification, "SMS", fn delivery ->
        %{delivery_id: delivery.id, phone: user_phone, body: notification.body}
        |> SmsWorker.new()
        |> Oban.insert()
      end)
    end

    {:ok, notification}
  end

  defp dispatch_channel(notification, channel, queue_fun) do
    {:ok, delivery} =
      %Delivery{}
      |> Delivery.changeset(%{
        notification_id: notification.id,
        channel: channel,
        status: "PENDING"
      })
      |> Repo.insert()

    queue_fun.(delivery)
  end

  # -------------------------------------------------------------
  # Event Ingestion & Idempotency
  # -------------------------------------------------------------

  def process_event(%{"eventId" => event_id, "eventType" => event_type} = event) do
    # Check if already processed
    case Repo.get(ProcessedEvent, event_id) do
      %ProcessedEvent{} ->
        Logger.info("[Notifications] Event '#{event_id}' already processed, skipping.")
        {:ok, :already_processed}

      nil ->
        Repo.transaction(fn ->
          # Record event processing
          %ProcessedEvent{}
          |> ProcessedEvent.changeset(%{
            event_id: event_id,
            event_type: event_type,
            processed_at: DateTime.utc_now()
          })
          |> Repo.insert!()

          # Route event to notification
          data = Map.get(event, "data") || %{}
          user_id = Map.get(data, "userId") || "user-default"
          email = Map.get(data, "email")
          phone = Map.get(data, "phone")

          {title, body} = build_event_content(event_type, data)

          {:ok, notification} =
            create_notification(%{
              user_id: user_id,
              type: event_type,
              title: title,
              body: body,
              data: data,
              status: "PENDING"
            })

          dispatch(notification, email, phone)
        end)
    end
  end

  defp build_event_content(event_type, data) do
    order_number = Map.get(data, "orderNumber") || Map.get(data, "orderId") || ""
    tracking_number = Map.get(data, "trackingNumber") || ""

    case event_type do
      "OrderPaid" ->
        {"Payment Successful", "Your payment for order #{order_number} was successful."}

      "OrderShipped" ->
        {"Order Shipped", "Your order #{order_number} has shipped. Tracking: #{tracking_number}"}

      "OrderDelivered" ->
        {"Order Delivered 📦", "Your order #{order_number} has been delivered."}

      "PaymentFailed" ->
        {"Payment Failed", "Payment for order #{order_number} failed. Please update payment method."}

      "PromotionActivated" ->
        promo_name = Map.get(data, "name") || "Special Sale"
        {"New Promotion!", "#{promo_name} is now live."}

      "ReviewPublished" ->
        {"Review Published", "Your product review is now published."}

      _ ->
        {"Notification", "You have an update regarding #{event_type}."}
    end
  end

  # -------------------------------------------------------------
  # Templates
  # -------------------------------------------------------------

  def get_template(code, channel, lang \\ "en") do
    case Repo.get_by(Template, code: code, channel: channel, language: lang, status: "ACTIVE") do
      %Template{subject: subj, body: body} ->
        {subj || "", body}

      nil ->
        TemplateEngine.default_template(code, channel)
    end
  end

  def list_templates do
    Repo.all(Template)
  end

  def create_template(attrs) do
    %Template{}
    |> Template.changeset(attrs)
    |> Repo.insert()
  end

  # -------------------------------------------------------------
  # Preferences
  # -------------------------------------------------------------

  def get_user_preferences(user_id) do
    Repo.all(from p in Preference, where: p.user_id == ^user_id)
  end

  def get_or_create_preferences(user_id, notification_type) do
    case Repo.get_by(Preference, user_id: user_id, notification_type: notification_type) do
      %Preference{} = pref ->
        pref

      nil ->
        # Defaults
        {:ok, pref} =
          %Preference{}
          |> Preference.changeset(%{
            user_id: user_id,
            notification_type: notification_type,
            email_enabled: true,
            push_enabled: true,
            sms_enabled: false,
            in_app_enabled: true
          })
          |> Repo.insert()

        pref
    end
  end

  def update_user_preferences(user_id, attrs) do
    Enum.map(attrs, fn {type, channel_prefs} ->
      pref = get_or_create_preferences(user_id, to_string(type))

      pref
      |> Preference.changeset(%{
        email_enabled: Map.get(channel_prefs, "email", pref.email_enabled),
        push_enabled: Map.get(channel_prefs, "push", pref.push_enabled),
        sms_enabled: Map.get(channel_prefs, "sms", pref.sms_enabled),
        in_app_enabled: Map.get(channel_prefs, "inApp", pref.in_app_enabled)
      })
      |> Repo.update()
    end)
  end

  # -------------------------------------------------------------
  # Devices
  # -------------------------------------------------------------

  def list_user_devices(user_id) do
    Repo.all(from d in Device, where: d.user_id == ^user_id and d.status == "ACTIVE")
  end

  def register_device(user_id, attrs) do
    device_id = Map.get(attrs, "deviceId") || Map.get(attrs, :deviceId)

    case Repo.get_by(Device, user_id: user_id, device_id: device_id) do
      nil ->
        %Device{}
        |> Device.changeset(Map.merge(attrs, %{"user_id" => user_id, "device_id" => device_id, "status" => "ACTIVE"}))
        |> Repo.insert()

      device ->
        device
        |> Device.changeset(Map.merge(attrs, %{"status" => "ACTIVE", "last_seen_at" => DateTime.utc_now()}))
        |> Repo.update()
    end
  end

  def remove_device(user_id, device_id) do
    case Repo.get_by(Device, user_id: user_id, device_id: device_id) do
      nil -> {:error, :not_found}
      device -> Repo.delete(device)
    end
  end

  defp to_int(val, _default) when is_integer(val), do: val
  defp to_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> default
    end
  end
  defp to_int(_val, default), do: default
end
