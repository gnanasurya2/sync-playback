import convertTime from '@/utils/convertTime';
import {
  PauseIcon,
  PlayIcon,
  EnterFullScreenIcon,
  ExitFullScreenIcon,
} from '@radix-ui/react-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ControlBarProps = {
  currentTime: number;
  totalTime: number;
  onPlayClick: () => void;
  onPauseClick: () => void;
  onFullScreenClick: () => void;
  onFullScreenCloseClick: () => void;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  isFullScreen: boolean;
};

export default ({
  currentTime,
  isPlaying,
  isFullScreen,
  totalTime,
  onSeek,
  onPlayClick,
  onPauseClick,
  onFullScreenClick,
  onFullScreenCloseClick,
}: ControlBarProps) => {
  const memoizedTotalTime = useMemo(() => convertTime(totalTime), [totalTime]);

  const keyPressHandler = useCallback(
    (event: KeyboardEvent) => {
      console.log('keyboard', event);
      switch (event.code) {
        case 'Space': {
          isPlaying ? onPauseClick() : onPlayClick();
          break;
        }
        case 'KeyF': {
          isFullScreen ? onFullScreenCloseClick() : onFullScreenClick();
          break;
        }
      }
    },
    [
      isPlaying,
      onPauseClick,
      onPlayClick,
      isFullScreen,
      onFullScreenCloseClick,
      onFullScreenClick,
    ],
  );

  useEffect(() => {
    window.addEventListener('keypress', keyPressHandler);

    return () => {
      window.removeEventListener('keypress', keyPressHandler);
    };
  }, [keyPressHandler]);

  return (
    <div className="absolute bottom-[-40px] delay-1000 w-full transition-[bottom]  group-hover:bottom-0 group-hover:delay-200">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center">
          {isPlaying ? (
            <PauseIcon width={20} height={20} onClick={onPauseClick} />
          ) : (
            <PlayIcon width={20} height={20} onClick={onPlayClick} />
          )}
          <p className="text-white mx-2">
            {convertTime(currentTime)} / {memoizedTotalTime}
          </p>
        </div>
        <div className="flex items-center">
          {isFullScreen ? (
            <ExitFullScreenIcon
              width={20}
              height={20}
              onClick={onFullScreenCloseClick}
            />
          ) : (
            <EnterFullScreenIcon
              width={20}
              height={20}
              onClick={onFullScreenClick}
            />
          )}
        </div>
      </div>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="bg-slate-300 h-1 my-1 mx-1 rounded-xl"
        onClick={(event) => {
          console.log(
            'event',
            event.clientX,
            //@ts-ignore
            event.target,
            event,
          );

          onSeek(
            //@ts-ignore
            (event.clientX / event.target.getBoundingClientRect().width) *
              totalTime,
          );
        }}
      >
        <div
          className="bg-slate-500 h-1 rounded-xl"
          style={{
            width: `${(currentTime / totalTime) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};
