FROM golang:1.22.5 as builder

WORKDIR /app

COPY ./src ./

RUN go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -o /sync-playback

CMD [ "/sync-playback" ]



FROM alpine:3.11
LABEL maintainer="gnanasurya"
COPY --from=builder /sync-playback /usr/sync-playback

ENTRYPOINT ["/usr/sync-playback"]