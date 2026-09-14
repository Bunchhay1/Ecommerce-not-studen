defmodule NotificationService.Repo.Migrations.CreateNotificationTables do
  use Ecto.Migration

  def change do
    # 1. notifications
    create table(:notifications, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, :string, null: false
      add :type, :string, null: false
      add :title, :string, null: false
      add :body, :text, null: false
      add :data, :map, default: %{}
      add :status, :string, default: "PENDING", null: false
      add :priority, :string, default: "NORMAL", null: false
      add :read_at, :utc_datetime
      add :expires_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:notifications, [:user_id])
    create index(:notifications, [:status])
    create index(:notifications, [:type])

    # 2. notification_deliveries
    create table(:notification_deliveries, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :notification_id, references(:notifications, type: :binary_id, on_delete: :delete_all), null: false
      add :channel, :string, null: false
      add :provider, :string
      add :status, :string, default: "PENDING", null: false
      add :provider_message_id, :string
      add :attempt_count, :integer, default: 0
      add :last_error, :text
      add :sent_at, :utc_datetime
      add :delivered_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:notification_deliveries, [:notification_id])
    create index(:notification_deliveries, [:channel])

    # 3. notification_templates
    create table(:notification_templates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :code, :string, null: false
      add :channel, :string, null: false
      add :subject, :string
      add :body, :text, null: false
      add :language, :string, default: "en"
      add :version, :integer, default: 1
      add :status, :string, default: "ACTIVE"

      timestamps(type: :utc_datetime)
    end

    create unique_index(:notification_templates, [:code, :channel, :language])

    # 4. notification_preferences
    create table(:notification_preferences, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, :string, null: false
      add :notification_type, :string, null: false
      add :email_enabled, :boolean, default: true
      add :sms_enabled, :boolean, default: false
      add :push_enabled, :boolean, default: true
      add :in_app_enabled, :boolean, default: true

      timestamps(type: :utc_datetime)
    end

    create unique_index(:notification_preferences, [:user_id, :notification_type])

    # 5. notification_devices
    create table(:notification_devices, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, :string, null: false
      add :device_id, :string, null: false
      add :platform, :string, null: false
      add :push_token, :text, null: false
      add :status, :string, default: "ACTIVE"
      add :last_seen_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:notification_devices, [:user_id, :device_id])

    # 6. processed_events (Idempotency)
    create table(:processed_events, primary_key: false) do
      add :event_id, :string, primary_key: true
      add :event_type, :string, null: false
      add :processed_at, :utc_datetime, null: false
    end

    # 7. notification_outbox
    create table(:notification_outbox, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :aggregate_type, :string, null: false
      add :aggregate_id, :string, null: false
      add :event_type, :string, null: false
      add :payload, :map, null: false
      add :status, :string, default: "PENDING"
      add :retry_count, :integer, default: 0
      add :published_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end
  end
end
