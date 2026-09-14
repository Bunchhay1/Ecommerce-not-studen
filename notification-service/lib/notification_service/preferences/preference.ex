defmodule NotificationService.Preferences.Preference do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "notification_preferences" do
    field :user_id, :string
    field :notification_type, :string
    field :email_enabled, :boolean, default: true
    field :sms_enabled, :boolean, default: false
    field :push_enabled, :boolean, default: true
    field :in_app_enabled, :boolean, default: true

    timestamps(type: :utc_datetime)
  end

  def changeset(pref, attrs) do
    pref
    |> cast(attrs, [:user_id, :notification_type, :email_enabled, :sms_enabled, :push_enabled, :in_app_enabled])
    |> validate_required([:user_id, :notification_type])
    |> unique_constraint([:user_id, :notification_type])
  end
end
