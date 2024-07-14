import Navbar from '@/components/custom/navbar';
import Video2 from '@/components/custom/Video2';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/context';
import useSyncTime from '@/hooks/useSyncTime';
import { useContext, useMemo, useRef, useState } from 'react';

export default () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedVideo, setSelectedVideo] = useState<File | null>();
  useSyncTime();
  const {
    data: { isCreator },
  } = useContext(AuthContext);

  const fileUrl = useMemo(
    () => selectedVideo && URL.createObjectURL(selectedVideo),
    [selectedVideo],
  );

  return (
    <div className="flex flex-col min-h-[100vh]">
      <Navbar />
      <div className="flex-1 flex justify-center items-center h-[100%]">
        {fileUrl ? (
          <Video2 fileUrl={fileUrl} />
        ) : (
          <>
            <Button
              variant="outline"
              className="border-dashed w-[400px] h-[300px] border-primary"
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <p className="text-xl">Click to select the file</p>
            </Button>
            <input
              type="file"
              className="hidden"
              accept="video/*"
              onChange={(event) => {
                console.log('files', fileInputRef.current?.files?.item(0));
                setSelectedVideo(fileInputRef.current?.files?.item(0));
              }}
              ref={fileInputRef}
            />
          </>
        )}
      </div>
    </div>
  );
};
