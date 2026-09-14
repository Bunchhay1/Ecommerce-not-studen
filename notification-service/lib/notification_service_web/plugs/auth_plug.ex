defmodule NotificationServiceWeb.Plugs.AuthPlug do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] ->
        # Simple extraction or verification
        user_id = parse_token_or_default(token)
        assign(conn, :current_user_id, user_id)

      _ ->
        assign(conn, :current_user_id, "anonymous-user")
    end
  end

  defp parse_token_or_default(token) do
    # When in dev/test, decode token or extract sub
    case String.split(token, ".") do
      [_h, payload, _s] ->
        case Base.decode64(payload, padding: false) do
          {:ok, json_str} ->
            case Jason.decode(json_str) do
              {:ok, %{"sub" => sub}} -> sub
              {:ok, %{"userId" => uid}} -> uid
              _ -> "user-123"
            end
          _ -> "user-123"
        end
      _ -> "user-123"
    end
  end
end
