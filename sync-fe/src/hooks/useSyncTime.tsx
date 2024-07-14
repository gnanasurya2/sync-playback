import { useGetSyncedTime } from '@/api/socketEvents/getSyncTime';
import { EventType } from '@/api/socketEvents/types';
import { useWebSocket } from '@/context';
import { useCallback, useEffect, useRef, useState } from 'react';

let interval = 0;

export default () => {
  const [isTimeSynced, setIsTimeSynced] = useState(false);
  const [offset, setOffset] = useState(0);
  const numberOfRequest = useRef(0);

  const { data } = useGetSyncedTime();
  const { pushEvent } = useWebSocket();

  useEffect(() => {
    if (!interval) {
      interval = window.setInterval(() => {
        pushEvent(EventType.SYNC_TIME, { originTimestamp: Date.now() });
      }, 10000);

      // start the initial to avoid the waiting for 10s.
      pushEvent(EventType.SYNC_TIME, { originTimestamp: Date.now() });
    }

    return () => {
      clearInterval(interval);
      interval = 0;
    };
  }, [pushEvent]);

  useEffect(() => {
    if (data) {
      const newOffset =
        (Date.now() -
          data.originTimestamp +
          (data.transmitTimestamp - data.receiveTimestamp)) /
        2;
      numberOfRequest.current = numberOfRequest.current + 1;
      // console.log('offset', newOffset, offset, numberOfRequest.current);

      setOffset((prev) =>
        Math.round(
          (prev * (numberOfRequest.current - 1) + newOffset) /
            numberOfRequest.current,
        ),
      );
    }
  }, [data]);

  const getCurrentTime = useCallback(() => Date.now() + offset, [offset]);

  return { isTimeSynced, getCurrentTime };
};
