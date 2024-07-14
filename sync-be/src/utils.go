package main

import (
	"math/rand/v2"
	"strconv"
	"strings"

	"github.com/google/uuid"
)

func RoomIdGenerator() string {
	var sb strings.Builder

	for i := 0; i < 6; i++ {
		sb.WriteString(strconv.Itoa(rand.IntN(10)))
	}
	return sb.String()
}

func UserIdGenerator() string {
	return uuid.NewString()
}
