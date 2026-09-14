defmodule NotificationServiceWeb.AuthPlugTest do
  use ExUnit.Case, async: true
  import Plug.Test
  import Plug.Conn
  alias NotificationServiceWeb.Plugs.AuthPlug

  test "assigns anonymous-user when Authorization header is absent" do
    conn = conn(:get, "/api/v1/notifications")
    conn = AuthPlug.call(conn, AuthPlug.init([]))

    assert conn.assigns[:current_user_id] == "anonymous-user"
  end

  test "assigns user_id from valid Bearer JWT payload" do
    payload = Base.encode64(~s({"sub": "usr_abc123", "role": "USER"}), padding: false)
    token = "header.#{payload}.signature"

    conn =
      conn(:get, "/api/v1/notifications")
      |> put_req_header("authorization", "Bearer " <> token)
      |> AuthPlug.call(AuthPlug.init([]))

    assert conn.assigns[:current_user_id] == "usr_abc123"
  end

  test "falls back gracefully when token is malformed" do
    conn =
      conn(:get, "/api/v1/notifications")
      |> put_req_header("authorization", "Bearer invalid-token")
      |> AuthPlug.call(AuthPlug.init([]))

    assert conn.assigns[:current_user_id] == "user-123"
  end
end
