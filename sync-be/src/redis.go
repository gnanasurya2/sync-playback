package main

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

type RedisChatRoom struct {
	RoomId      string   `redis:"roomId"`
	CreatedUser string   `redis:"createdUser"`
	Users       []string `redis:"users"`
}

func RedisCreateNewRoom(client *redis.Client, createdUser string, roomId string) error {

	err := client.HMSet(ctx, fmt.Sprintf("chatroom%s", roomId), map[string]interface{}{
		"roomId":      roomId,
		"createdUser": createdUser,
	}).Err()
	if err != nil {
		return err

	}

	err = RedisAddUserToRoom(client, roomId, createdUser)
	log.Println("redis response", err)
	return err
}

func RedisGetRoomDetails(client *redis.Client, roomId string) (*RedisChatRoom, error) {

	hash, err := client.HGetAll(ctx, fmt.Sprintf("chatroom%s", roomId)).Result()
	if err != nil {
		return nil, err
	}

	users, err := client.SMembers(ctx, fmt.Sprintf("chatroom%s:users", roomId)).Result()
	if err != nil {
		return nil, err
	}

	return &RedisChatRoom{
		RoomId:      hash["roomId"],
		CreatedUser: hash["createdUser"],
		Users:       users,
	}, err
}

func RedisAddUserToRoom(client *redis.Client, roomId string, userId string) error {
	return client.SAdd(ctx, fmt.Sprintf("chatroom%s:users", roomId), userId).Err()
}

func RedisGetUsersInRoom(client *redis.Client, roomId string) ([]string, error) {
	return client.SMembers(ctx, fmt.Sprintf("chatroom%s:users", roomId)).Result()
}

func RedisRemoveUserFromRoom(client *redis.Client, roomId string, userId string) error {
	return client.SRem(ctx, fmt.Sprintf("chatroom%s:users", roomId), userId).Err()
}

func RedisDeleteRoom(client *redis.Client, roomId string) error {
	pipe := client.TxPipeline()

	pipe.Del(ctx, fmt.Sprintf("chatroom%s", roomId))

	pipe.Del(ctx, fmt.Sprintf("chatroom%s:users", roomId))

	_, err := pipe.Exec(ctx)
	return err
}
