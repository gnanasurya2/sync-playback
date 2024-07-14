package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func PingResponder(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "PONG")
}

func setupApi() {
	err := godotenv.Load()
	if err != nil {
		log.Println("env not found")
	}

	redisHost := os.Getenv("REDIS_HOST")

	ctx := context.Background()
	client := redis.NewClient(&redis.Options{
		Addr:     redisHost,
		Password: "",
		DB:       0,
	})

	res := client.Ping(ctx)

	log.Println("redis ping", res)

	manager := NewManager(client)

	http.HandleFunc("/ws", manager.serveWS)
	http.HandleFunc("/ping", PingResponder)
}

func main() {
	setupApi()

	log.Fatal(http.ListenAndServe(":9543", nil))
}
