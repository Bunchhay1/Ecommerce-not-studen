defmodule NotificationService.Notifications.Notification do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "notifications" do
    field :user_id, :string
    field :type, :string
    field :title, :string
    field :body, :string
    field :data, :map, default: %{}
    field :status, :string, default: "PENDING"
    field :priority, :string, default: "NORMAL"
    field :read_at, :utc_datetime
    field :expires_at, :utc_datetime

    has_many :deliveries, NotificationService.Deliveries.Delivery

    timestamps(type: :utc_datetime)
  end

  def changeset(notification, attrs) do
    notification
    |> cast(attrs, [:user_id, :type, :title, :body, :data, :status, :priority, :read_at, :expires_at])
    |> validate_required([:user_id, :type, :title, :body])
    |> validate_inclusion(:status, ["PENDING", "PROCESSING", "SENT", "DELIVERED", "FAILED", "READ", "CANCELLED", "EXPIRED"])
    |> validate_inclusion(:priority, ["CRITICAL", "HIGH", "NORMAL", "LOW"])
  end
end
