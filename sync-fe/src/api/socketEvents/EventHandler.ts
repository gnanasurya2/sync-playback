import type { QueryClient } from '@tanstack/react-query';
import {
  EventType,
  type IncomingPlaybackEvent,
  type EventPayload,
} from './types';
import type { IncomingRequest } from './acceptIncomingRequest';
import type { SyncTimeResponse } from './getSyncTime';
import type { JoinEventType } from './getRoomId';

export const SocketEventHandler = (client: QueryClient, data: EventPayload) => {
  switch (data.type) {
    case EventType.JOINED_ROOM: {
      client.setQueryData<JoinEventType>(['getRoomId'], (oldData) => {
        console.log('oldRoom', oldData, data);
        return data.payload;
      });
      break;
    }
    case EventType.REQUEST_TO_JOIN: {
      client.setQueryData<Array<IncomingRequest>>(
        ['acceptIncomingRequest'],
        (oldData) => {
          return oldData
            ? [...oldData, { ...data.payload, toastShown: false }]
            : [{ ...data.payload, toastShown: false }];
        },
      );
      break;
    }
    case EventType.SYNC_TIME_RESPONSE: {
      client.setQueryData<SyncTimeResponse>(['syncTimeResponse'], () => {
        return data.payload;
      });
      break;
    }
    case EventType.INCOMING_VIDEO_PLAYBACK_EVENT: {
      client.setQueryData<IncomingPlaybackEvent>(
        ['incomingPlaybackEvent'],
        () => {
          return data.payload;
        },
      );
    }
  }
};
