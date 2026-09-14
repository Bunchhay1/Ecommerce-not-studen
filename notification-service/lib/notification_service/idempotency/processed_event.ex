defmodule NotificationService.Idempotency.ProcessedEvent do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:event_id, :string, []}
  schema "processed_events" do
    field :event_type, :string
    field :processed_at, :utc_datetime
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [:event_id, :event_type, :processed_at])
    |> validate_required([:event_id, :event_type])
  end
end
