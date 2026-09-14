defmodule NotificationService.Devices.Device do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "notification_devices" do
    field :user_id, :string
    field :device_id, :string
    field :platform, :string
    field :push_token, :string
    field :status, :string, default: "ACTIVE"
    field :last_seen_at, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  def changeset(device, attrs) do
    device
    |> cast(attrs, [:user_id, :device_id, :platform, :push_token, :status, :last_seen_at])
    |> validate_required([:user_id, :device_id, :platform, :push_token])
    |> validate_inclusion(:platform, ["IOS", "ANDROID", "WEB"])
    |> validate_inclusion(:status, ["ACTIVE", "INACTIVE"])
    |> unique_constraint([:user_id, :device_id])
  end
end
