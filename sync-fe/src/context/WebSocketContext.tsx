import type React from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { SocketEventHandler } from '@/api/socketEvents/EventHandler';
import type {
  EventPayload,
  EventPayloads,
  EventType,
} from '@/api/socketEvents/types';
import { useQueryClient } from '@tanstack/react-query';

let websocket: WebSocket | null = null;

export enum SocketState {
  UNINSTANTIATED = 0,
  CONNECTING = 1,
  READY = 2,
  CLOSED = 3,
}
interface WebSocketContextProps {
  state: SocketState;
  websocket: WebSocket | null;
  pushEvent: <T extends EventType>(
    eventType: T,
    payload: EventPayloads[T],
  ) => void;
  shouldConnectHandler: (value: boolean) => void;
}

const WebSocketContext = createContext<WebSocketContextProps>({
  state: SocketState.UNINSTANTIATED,
  websocket: null,
  pushEvent: () => {},
  shouldConnectHandler: () => {},
});

export const WebSocketProvider = ({
  children,
}: { children: React.ReactNode }) => {
  const [socketState, setSocketState] = useState(SocketState.UNINSTANTIATED);
  const [shouldConnect, setShouldConnect] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!websocket && shouldConnect) {
      websocket = new WebSocket(process.env.PUBLIC_WEBSOCKET_URL || '');

      setSocketState(SocketState.CONNECTING);

      websocket.onopen = () => {
        console.log('connected successfully');
        setSocketState(SocketState.READY);
      };

      websocket.onmessage = (event) => {
        const parsedEvent: EventPayload = JSON.parse(event.data);
        console.log('message', parsedEvent);
        SocketEventHandler(queryClient, parsedEvent);
      };

      websocket.onclose = (event) => {
        console.log('close message', event);
        console.log(`Closed with code: ${event.code}, reason: ${event.reason}`);
        setSocketState(SocketState.CLOSED);
        websocket = null;
      };

      websocket.onerror = (event) => {
        console.error('WebSocket error observed:', event);
      };
    }

    return () => {
      if (websocket) {
        websocket.close();
        websocket = null;
      }
    };
  }, [queryClient, shouldConnect]);

  const pushEvent = useCallback(
    <T extends EventType>(eventType: T, payload: EventPayloads[T]) => {
      if (!websocket) {
        throw Error('websocket is not connected');
      }
      const event = { type: eventType, payload: { ...payload } };
      websocket.send(JSON.stringify(event));
    },
    [],
  );
  const shouldConnectHandler = useCallback((value: boolean) => {
    setShouldConnect(value);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ state: socketState, websocket, pushEvent, shouldConnectHandler }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
