export enum EventType {
  CREATE_ROOM = 'create_room',
  JOINED_ROOM = 'joined_room',
  JOIN_ROOM = 'join_room',
  REQUEST_TO_JOIN = 'request_to_join_room',
  ACCEPT_JOIN_REQUEST = 'accept_join_request',
  SYNC_TIME = 'sync_time',
  SYNC_TIME_RESPONSE = 'sync_time_response',
  VIDEO_PLAYBACK_EVENT = 'video_playback_event',
  INCOMING_VIDEO_PLAYBACK_EVENT = 'incoming_video_playback_event',
}

export enum PlaybackEvents {
  PLAY = 'play',
  PAUSE = 'pause',
  SEEK = 'seek',
}

export type IncomingPlaybackEvent = {
  action: PlaybackEvents;
  videoTime: number;
  actionTimeStamp: number;
};

export type EventPayloads = {
  [EventType.CREATE_ROOM]: {
    password: string;
  };
  [EventType.JOINED_ROOM]: {
    roomId: string;
    time: string;
    isCreator: boolean;
  };
  [EventType.JOIN_ROOM]: {
    roomId: string;
    name: string;
  };
  [EventType.ACCEPT_JOIN_REQUEST]: {
    userId: string;
    name: string;
  };
  [EventType.REQUEST_TO_JOIN]: {
    name: string;
    roomId: string;
    userId: string;
  };
  [EventType.SYNC_TIME]: {
    originTimestamp: number;
  };
  [EventType.SYNC_TIME_RESPONSE]: {
    originTimestamp: number;
    receiveTimestamp: number;
    transmitTimestamp: number;
  };
  [EventType.VIDEO_PLAYBACK_EVENT]: {
    action: PlaybackEvents;
    videoTime: number;
  };
  [EventType.INCOMING_VIDEO_PLAYBACK_EVENT]: IncomingPlaybackEvent;
};

export type EventPayload = {
  [K in keyof EventPayloads]: { type: K } & { payload: EventPayloads[K] };
}[keyof EventPayloads];
