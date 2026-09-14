defmodule NotificationService.Outbox.OutboxEvent do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "notification_outbox" do
    field :aggregate_type, :string
    field :aggregate_id, :string
    field :event_type, :string
    field :payload, :map
    field :status, :string, default: "PENDING"
    field :retry_count, :integer, default: 0
    field :published_at, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  def changeset(outbox, attrs) do
    outbox
    |> cast(attrs, [:aggregate_type, :aggregate_id, :event_type, :payload, :status, :retry_count, :published_at])
    |> validate_required([:aggregate_type, :aggregate_id, :event_type, :payload])
  end
end
