package main

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

var (
	websocketUpgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if strings.Contains(origin, "gnanasurya") || strings.Contains(origin, "localhost") {
				return true
			}
			return false
		},
	}
)

var eventsEligibleWithoutRoomId = []string{EventSendMessage}

var (
	ErrEventNotSupported = errors.New("event type is not supported")
	ErrEventNotValid     = errors.New("event type is not valid")
)

type Manager struct {
	clients ClientList

	redis *redis.Client

	sync.RWMutex

	handlers map[string]EventHandler
}

func NewManager(redis *redis.Client) *Manager {
	m := &Manager{
		redis:    redis,
		clients:  make(ClientList),
		handlers: make(map[string]EventHandler),
	}
	m.setupEventHandlers()
	return m
}

func (m *Manager) setupEventHandlers() {
	m.handlers[EventSendMessage] = SendMessageHandler
	m.handlers[EventCreateRoom] = CreateRoomHandler
	m.handlers[EventJoinRoom] = RequestToJoinHandler
	m.handlers[EventAcceptJoinRequest] = AcceptJoinRequest
	m.handlers[EventSyncTime] = SyncTime
	m.handlers[VideoPlaybackEvent] = PlayBackEvent
}

func (m *Manager) routeEvent(e Event, c *Client) error {

	isValidEvent := true
	log.Println("new event", e.Type, c.roomId)
	if c.roomId == "" {
		for _, eventName := range eventsEligibleWithoutRoomId {
			if eventName == e.Type {
				isValidEvent = false
			}
		}
	}

	if !isValidEvent {
		return ErrEventNotSupported
	}

	if handler, ok := m.handlers[e.Type]; ok {
		if err := handler(e, c); err != nil {
			return err
		}
		return nil
	} else {
		return ErrEventNotSupported
	}
}
func (m *Manager) serveWS(w http.ResponseWriter, r *http.Request) {
	log.Println("New connection")

	conn, err := websocketUpgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println(err)
		return
	}

	client := NewClient(conn, m)

	m.addClient(client)

	go client.ReadMessages()

	go client.WriteMessages()

}

func (m *Manager) addClient(client *Client) {
	m.Lock()
	defer m.Unlock()

	m.clients[client.clientId] = client
}

func (m *Manager) removeClient(client *Client) {
	m.Lock()
	defer m.Unlock()

	if _, ok := m.clients[client.clientId]; ok {
		client.connection.Close()

		if client.isRoomOwner {
			RedisDeleteRoom(m.redis, client.roomId)
		} else {
			RedisRemoveUserFromRoom(m.redis, client.roomId, client.clientId)
		}

		delete(m.clients, client.clientId)
	}
}
