defmodule NotificationService.Deliveries.Delivery do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "notification_deliveries" do
    field :channel, :string
    field :provider, :string
    field :status, :string, default: "PENDING"
    field :provider_message_id, :string
    field :attempt_count, :integer, default: 0
    field :last_error, :string
    field :sent_at, :utc_datetime
    field :delivered_at, :utc_datetime

    belongs_to :notification, NotificationService.Notifications.Notification

    timestamps(type: :utc_datetime)
  end

  def changeset(delivery, attrs) do
    delivery
    |> cast(attrs, [
      :notification_id,
      :channel,
      :provider,
      :status,
      :provider_message_id,
      :attempt_count,
      :last_error,
      :sent_at,
      :delivered_at
    ])
    |> validate_required([:notification_id, :channel])
    |> validate_inclusion(:channel, ["EMAIL", "SMS", "PUSH", "IN_APP"])
    |> validate_inclusion(:status, ["PENDING", "PROCESSING", "SENT", "DELIVERED", "FAILED"])
  end
end
