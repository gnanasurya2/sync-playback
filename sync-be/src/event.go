package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

type Event struct {
	Type string `json:"type"`

	Payload json.RawMessage `json:"payload"`
}

type EventHandler func(event Event, c *Client) error

const (
	EventSendMessage           = "send_message"
	EventNewMessage            = "new_message"
	EventCreateRoom            = "create_room"
	EventJoinedRoom            = "joined_room"
	EventJoinRoom              = "join_room"
	EventRequestToJoinRoom     = "request_to_join_room"
	EventAcceptJoinRequest     = "accept_join_request"
	EventNewUserJoined         = "new_user_joined"
	EventSyncTime              = "sync_time"
	EventSyncTimeResponse      = "sync_time_response"
	VideoPlaybackEvent         = "video_playback_event"
	InComingVideoPlaybackEvent = "incoming_video_playback_event"
)

type SendMessageEvent struct {
	Message string `json:"message"`
	From    string `json:"from"`
}

type SentMessageEvent struct {
	Message string `json:"message"`
	From    string `json:"from"`
}

type NewMessageEvent struct {
	SendMessageEvent
	Sent time.Time `json:"sent"`
}

func SendMessageHandler(e Event, c *Client) error {
	log.Println("send message", e.Payload)

	var chatEvent SendMessageEvent
	if err := json.Unmarshal(e.Payload, &chatEvent); err != nil {
		return fmt.Errorf("error due to unmarshalling %v", err)
	}

	var messageEvent NewMessageEvent

	messageEvent.From = chatEvent.From
	messageEvent.Message = chatEvent.Message
	messageEvent.Sent = time.Now()

	data, err := json.Marshal(messageEvent)
	if err != nil {
		return fmt.Errorf("error while marshalling %v", err)
	}

	var outgoingEvent Event

	outgoingEvent.Type = EventNewMessage
	outgoingEvent.Payload = data

	for clientId, client := range c.manager.clients {
		if client.roomId == c.roomId && clientId != c.clientId {
			client.egress <- outgoingEvent
		}

	}

	return nil
}

type NewRoomEvent struct {
	RoomId    string    `json:"roomId"`
	Time      time.Time `json:"time"`
	IsCreator bool      `json:"isCreator"`
}

type CreateRoomEvent struct {
	Password string `json:"password"`
}

func CreateRoomHandler(e Event, c *Client) error {
	var createEvent CreateRoomEvent
	if err := json.Unmarshal(e.Payload, &createEvent); err != nil {
		return fmt.Errorf("error due to unmarshalling %v", err)
	}

	allowedPassword := os.Getenv("CREATOR_PASSWORD")

	if createEvent.Password != allowedPassword {
		return fmt.Errorf("invalid password - %s", createEvent.Password)
	}

	roomId := RoomIdGenerator()
	roomEvent := NewRoomEvent{
		RoomId:    roomId,
		Time:      time.Now(),
		IsCreator: true,
	}

	var outgoingEvent Event

	err := RedisCreateNewRoom(c.manager.redis, c.clientId, roomId)
	if err != nil {
		return fmt.Errorf("error while creating the room %v", err)
	}

	data, err := json.Marshal(roomEvent)

	if err != nil {
		return fmt.Errorf("error while marshalling %v", err)
	}

	outgoingEvent.Type = EventJoinedRoom
	outgoingEvent.Payload = data

	c.roomId = roomId
	c.isRoomOwner = true
	c.egress <- outgoingEvent

	return nil
}

type RequestToJoinEvent struct {
	RoomId string `json:"roomId"`
	Name   string `json:"name"`
}

type RequestToCreaterEvent struct {
	RoomId      string `json:"roomId"`
	Name        string `json:"name"`
	RequesterId string `json:"userId"`
}

func RequestToJoinHandler(e Event, c *Client) error {
	var incomingEvent RequestToJoinEvent

	if err := json.Unmarshal(e.Payload, &incomingEvent); err != nil {
		return fmt.Errorf("error while marshalling %v", err)
	}

	c.roomId = incomingEvent.RoomId

	roomDetails, err := RedisGetRoomDetails(c.manager.redis, incomingEvent.RoomId)
	if err != nil || roomDetails.CreatedUser == "" {
		return fmt.Errorf("room doesn't exist %v", incomingEvent.RoomId)
	}

	var outgoingEvent Event

	roomEvent := RequestToCreaterEvent{
		RoomId:      roomDetails.RoomId,
		Name:        incomingEvent.Name,
		RequesterId: c.clientId,
	}

	data, err := json.Marshal(roomEvent)
	if err != nil {
		return fmt.Errorf("error while unmarshalling %v", err)
	}

	outgoingEvent.Type = EventRequestToJoinRoom
	outgoingEvent.Payload = data

	roomOwnerClient, ok := c.manager.clients[roomDetails.CreatedUser]
	if !ok {
		return fmt.Errorf("room doesn't exist %v", incomingEvent.RoomId)
	}

	roomOwnerClient.egress <- outgoingEvent

	return nil
}

type AcceptJoinRoom struct {
	UserId string `json:"userId"`
	Name   string `json:"name"`
}

type NewUserPayload struct {
	Name     string   `json:"name"`
	AllUsers []string `json:"allUsers"`
}

func AcceptJoinRequest(e Event, c *Client) error {
	var incomingEvent AcceptJoinRoom

	if err := json.Unmarshal(e.Payload, &incomingEvent); err != nil {
		return fmt.Errorf("error while unmarshalling %v", err)
	}

	requestClient, ok := c.manager.clients[incomingEvent.UserId]
	if !ok {
		return fmt.Errorf("unable to find the user %v", incomingEvent.Name)
	}

	err := RedisAddUserToRoom(c.manager.redis, c.roomId, requestClient.clientId)
	if err != nil {
		return fmt.Errorf("unable to find the user %v", err)
	}

	requestClient.roomId = c.roomId
	requestClient.isRoomOwner = false

	usersInTheRoom, err := RedisGetUsersInRoom(c.manager.redis, c.roomId)
	if err != nil {
		return fmt.Errorf("unable to find the user %v", err)
	}

	newUserPayload := NewUserPayload{
		Name:     incomingEvent.Name,
		AllUsers: usersInTheRoom,
	}

	data, err := json.Marshal(newUserPayload)
	if err != nil {
		return fmt.Errorf("error while marshalling %v", err)
	}

	var outgoingEvent Event
	outgoingEvent.Type = EventNewUserJoined
	outgoingEvent.Payload = data

	for _, user := range usersInTheRoom {
		userClient, ok := c.manager.clients[user]
		if ok {
			if userClient.clientId == requestClient.clientId {
				roomEvent := NewRoomEvent{
					RoomId:    c.roomId,
					Time:      time.Now(),
					IsCreator: false,
				}
				data, err := json.Marshal(roomEvent)
				if err != nil {
					return fmt.Errorf("error while marshalling %v", err)
				}
				var joinedRoomEvent Event
				joinedRoomEvent.Type = EventJoinedRoom
				joinedRoomEvent.Payload = data

				userClient.egress <- joinedRoomEvent
			} else {
				userClient.egress <- outgoingEvent
			}

		}
	}
	return nil
}

type SyncTimeRequest struct {
	OriginTimestamp int64 `json:"originTimestamp"`
}

type SyncTimeResponse struct {
	OriginTimestamp   int64 `json:"originTimestamp"`
	ReceiveTimestamp  int64 `json:"receiveTimestamp"`
	TransmitTimestamp int64 `json:"transmitTimestamp"`
}

func SyncTime(e Event, c *Client) error {
	receiveTimestamp := time.Now().UnixMilli()

	var incomingEvent SyncTimeRequest

	if err := json.Unmarshal(e.Payload, &incomingEvent); err != nil {
		return fmt.Errorf("error while unmarshalling %v", err)
	}

	response := SyncTimeResponse{
		OriginTimestamp:   incomingEvent.OriginTimestamp,
		ReceiveTimestamp:  receiveTimestamp,
		TransmitTimestamp: time.Now().UnixMilli(),
	}

	data, err := json.Marshal(response)
	if err != nil {
		return fmt.Errorf("error while marshalling %v", err)
	}

	var outgoingEvent Event
	outgoingEvent.Type = EventSyncTimeResponse
	outgoingEvent.Payload = data

	c.egress <- outgoingEvent

	return nil
}

type PlayBackEventPayload struct {
	Action    string `json:"action"`
	VideoTime int64  `json:"videoTime"`
}

type IncomingPlayBackEventPayload struct {
	Action          string `json:"action"`
	VideoTime       int64  `json:"videoTime"`
	ActionTimestamp int64  `json:"actionTimestamp"`
}

func PlayBackEvent(e Event, c *Client) error {
	eventActionTimestamp := time.Now().Add(time.Millisecond * 400).UnixMilli()

	var payload PlayBackEventPayload
	if err := json.Unmarshal(e.Payload, &payload); err != nil {
		return fmt.Errorf("error while unmarshalling %v", err)
	}

	response := IncomingPlayBackEventPayload{
		Action:          payload.Action,
		VideoTime:       payload.VideoTime,
		ActionTimestamp: eventActionTimestamp,
	}

	data, err := json.Marshal(response)
	if err != nil {
		return fmt.Errorf("error while marshalling %v", err)
	}
	var outEvent Event

	outEvent.Type = InComingVideoPlaybackEvent
	outEvent.Payload = data
	usersInTheRoom, err := RedisGetUsersInRoom(c.manager.redis, c.roomId)
	if err != nil {
		return fmt.Errorf("unable to find the user %v", err)
	}

	for _, user := range usersInTheRoom {
		userClient, ok := c.manager.clients[user]
		if ok {
			userClient.egress <- outEvent
		}
	}

	return nil
}
