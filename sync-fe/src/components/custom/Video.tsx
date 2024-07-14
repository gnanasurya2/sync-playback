import { useGetPlaybackEvent } from '@/api/socketEvents/getPlayBackEvents';
import { EventType, PlaybackEvents } from '@/api/socketEvents/types';
import { useWebSocket } from '@/context';
import useSyncTime from '@/hooks/useSyncTime';
import { useEffect, useRef } from 'react';
import ControlBar from './ControlBar';

type VideoProps = {
  isCreator: boolean;
  fileUrl?: string;
};
export default ({ isCreator, fileUrl = '/video.mp4' }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { pushEvent } = useWebSocket();
  const { data: playBackEvent } = useGetPlaybackEvent();
  const { getCurrentTime } = useSyncTime();
  const isUserTriggeredEvent = useRef(true);

  useEffect(() => {
    if (playBackEvent) {
      const eventTime = Math.min(
        playBackEvent.actionTimeStamp - getCurrentTime(),
        0,
      );
      switch (playBackEvent.action) {
        case PlaybackEvents.PLAY: {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = playBackEvent.videoTime;
              isUserTriggeredEvent.current = false;
              videoRef.current?.play();
            }
          }, eventTime);
          break;
        }
        case PlaybackEvents.PAUSE: {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = playBackEvent.videoTime;
              isUserTriggeredEvent.current = false;
              videoRef.current?.pause();
            }
          }, eventTime);
          break;
        }
      }
    }
  }, [playBackEvent, getCurrentTime]);
  return (
    // biome-ignore lint/a11y/useMediaCaption: <explanation>
    <video
      controls={false}
      className="w-8/12"
      ref={videoRef}
      //   onPlay={(event) => {
      //     videoRef.current?.pause();
      //     if (videoRef.current && isUserTriggeredEvent.current) {
      //       console.log('play time', videoRef.current?.currentTime);

      //       pushEvent(EventType.VIDEO_PLAYBACK_EVENT, {
      //         action: PlaybackEvents.PLAY,
      //         videoTime: Math.floor(videoRef.current?.currentTime),
      //       });
      //     }
      //     isUserTriggeredEvent.current = true;
      //   }}
      //   onPause={(event) => {
      //     if (videoRef.current && isUserTriggeredEvent.current) {
      //       videoRef.current.play();
      //       console.log('pause time', videoRef.current?.currentTime);

      //       pushEvent(EventType.VIDEO_PLAYBACK_EVENT, {
      //         action: PlaybackEvents.PLAY,
      //         videoTime: Math.floor(videoRef.current?.currentTime),
      //       });
      //     }
      //     isUserTriggeredEvent.current = true;
      //   }}
    >
      <source src={fileUrl} />
      {/* <ControlBar /> */}
    </video>
  );
};
