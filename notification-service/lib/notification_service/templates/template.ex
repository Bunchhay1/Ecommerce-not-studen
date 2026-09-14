defmodule NotificationService.Templates.Template do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "notification_templates" do
    field :code, :string
    field :channel, :string
    field :subject, :string
    field :body, :string
    field :language, :string, default: "en"
    field :version, :integer, default: 1
    field :status, :string, default: "ACTIVE"

    timestamps(type: :utc_datetime)
  end

  def changeset(template, attrs) do
    template
    |> cast(attrs, [:code, :channel, :subject, :body, :language, :version, :status])
    |> validate_required([:code, :channel, :body])
    |> validate_inclusion(:channel, ["EMAIL", "SMS", "PUSH", "IN_APP"])
    |> validate_inclusion(:status, ["ACTIVE", "INACTIVE"])
  end
end
