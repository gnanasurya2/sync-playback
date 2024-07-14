package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

var (
	pongWait = 10 * time.Second

	pingInterval = (pongWait * 9) / 10
)

type ClientList map[string]*Client

type Client struct {
	connection *websocket.Conn

	manager *Manager

	egress chan Event

	roomId string

	clientId string

	isRoomOwner bool
}

func NewClient(conn *websocket.Conn, manager *Manager) *Client {
	return &Client{
		connection: conn,
		manager:    manager,
		egress:     make(chan Event),
		clientId:   UserIdGenerator(),
	}
}

func (c *Client) ReadMessages() {
	defer func() {
		c.manager.removeClient(c)
	}()

	c.connection.SetReadLimit(512)

	if err := c.connection.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		log.Println(err)
		return
	}

	c.connection.SetPongHandler(c.pongHandler)

	for {

		messageType, payload, err := c.connection.ReadMessage()

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error while reading messages %v", err)
			}
			break
		}
		log.Println("MessageType", messageType)
		log.Println("payload", string(payload))

		var request Event
		if err := json.Unmarshal(payload, &request); err != nil {
			log.Printf("Error marshalling message: %v", err)
			break
		}

		if err := c.manager.routeEvent(request, c); err != nil {
			log.Println("Error handling the event", err)
			break
		}
	}
}

func (c *Client) pongHandler(pongMsg string) error {
	log.Println("pong")
	return c.connection.SetReadDeadline(time.Now().Add(pongWait))
}

func (c *Client) WriteMessages() {

	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()

		c.manager.removeClient(c)
	}()

	for {
		select {
		case message, ok := <-c.egress:
			if !ok {
				if err := c.connection.WriteMessage(websocket.CloseMessage, nil); err != nil {
					log.Println("closed the connection")
				}
				break
			}

			data, err := json.Marshal(message)
			if err != nil {
				log.Println("error marshaling the data")
				return
			}

			if err := c.connection.WriteMessage(websocket.TextMessage, data); err != nil {
				log.Println(err)
			}
			log.Println("sent message")
		case <-ticker.C:
			log.Println("ping")

			if err := c.connection.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				log.Println("error while pinging message", err)
				return
			}
		}
	}
}
