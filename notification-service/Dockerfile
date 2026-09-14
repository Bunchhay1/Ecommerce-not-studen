FROM elixir:1.20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache build-base git

ENV MIX_ENV=prod

RUN mix local.hex --force && \
    mix local.rebar --force

COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile

COPY config config
COPY lib lib
COPY priv priv

RUN mix compile
RUN mix release

FROM elixir:1.20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libstdc++ openssl ncurses-libs

COPY --from=builder /app/_build/prod/rel/notification_service ./

ENV PHX_SERVER=true
EXPOSE 8092

CMD ["sh", "-c", "bin/notification_service eval 'NotificationService.Release.migrate' && bin/notification_service start"]
