import { useGetPlaybackEvent } from '@/api/socketEvents/getPlayBackEvents';
import {
  EventType,
  type IncomingPlaybackEvent,
  PlaybackEvents,
} from '@/api/socketEvents/types';
import { useWebSocket } from '@/context';
import useSyncTime from '@/hooks/useSyncTime';
import { useCallback, useEffect, useRef, useState } from 'react';
import ControlBar from './ControlBar';
import { useQueryClient } from '@tanstack/react-query';

type VideoProps = {
  fileUrl: string;
};
export default ({ fileUrl }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { pushEvent } = useWebSocket();
  const { data: playBackEvent } = useGetPlaybackEvent();
  const { getCurrentTime } = useSyncTime();
  const client = useQueryClient();

  const onFullScreenChange = useCallback(() => {
    setIsFullScreen(Boolean(document.fullscreenElement?.tagName));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Math.floor(videoRef.current?.currentTime || 0));
    }, 1000);
    document.addEventListener('fullscreenchange', onFullScreenChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('fullscreenchange', onFullScreenChange);
    };
  }, [onFullScreenChange]);
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
              videoRef.current?.play();
              setIsPlaying(true);
              client.setQueryData<IncomingPlaybackEvent | null>(
                ['incomingPlaybackEvent'],
                () => {
                  return null;
                },
              );
            }
          }, eventTime);
          break;
        }
        case PlaybackEvents.PAUSE: {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = playBackEvent.videoTime;
              videoRef.current?.pause();
              setIsPlaying(false);
              client.setQueryData<IncomingPlaybackEvent | null>(
                ['incomingPlaybackEvent'],
                () => {
                  return null;
                },
              );
            }
          }, eventTime);
          break;
        }
        case PlaybackEvents.SEEK: {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = playBackEvent.videoTime;
              videoRef.current?.pause();
              setIsPlaying(false);
              client.setQueryData<IncomingPlaybackEvent | null>(
                ['incomingPlaybackEvent'],
                () => {
                  return null;
                },
              );
            }
          }, eventTime);
          break;
        }
      }
    }
  }, [playBackEvent, getCurrentTime, client]);

  return (
    <div className="w-8/12 relative overflow-hidden group" ref={wrapperRef}>
      {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
      <video
        controls={false}
        ref={videoRef}
        onCanPlay={() =>
          setTotalTime(Math.ceil(videoRef.current?.duration || 0))
        }
      >
        <source src={fileUrl} />
      </video>
      <ControlBar
        isPlaying={isPlaying}
        isFullScreen={isFullScreen}
        currentTime={currentTime}
        totalTime={totalTime}
        onPlayClick={() => {
          if (videoRef.current) {
            videoRef.current?.play();
            pushEvent(EventType.VIDEO_PLAYBACK_EVENT, {
              action: PlaybackEvents.PLAY,
              videoTime: Math.floor(videoRef.current?.currentTime),
            });
          }
        }}
        onPauseClick={() => {
          if (videoRef.current) {
            videoRef.current?.pause();
            pushEvent(EventType.VIDEO_PLAYBACK_EVENT, {
              action: PlaybackEvents.PAUSE,
              videoTime: Math.floor(videoRef.current?.currentTime),
            });
          }
        }}
        onFullScreenClick={() => {
          wrapperRef.current?.requestFullscreen();
          setIsFullScreen(true);
        }}
        onFullScreenCloseClick={async () => {
          await document.exitFullscreen();
          setIsFullScreen(false);
        }}
        onSeek={(time) => {
          console.log('time', time);
          if (videoRef.current) {
            pushEvent(EventType.VIDEO_PLAYBACK_EVENT, {
              action: PlaybackEvents.SEEK,
              videoTime: Math.floor(time),
            });
          }
        }}
      />
    </div>
  );
};
