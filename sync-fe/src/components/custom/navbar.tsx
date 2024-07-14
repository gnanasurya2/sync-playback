import { Separator } from '../ui/separator';
import ThemeSelector from './theme-selector';

export default () => {
  return (
    <>
      <div className="flex justify-between items-center px-4 py-2">
        <h1 className="font-bold text-lg">Sync Playback</h1>
        <ThemeSelector />
      </div>
      <Separator />
    </>
  );
};
