import { useQuery } from '@tanstack/react-query';
import type { IncomingPlaybackEvent } from './types';

export const useGetPlaybackEvent = () => {
  const query = useQuery<IncomingPlaybackEvent | null>({
    queryKey: ['incomingPlaybackEvent'],
    queryFn: () => Promise.resolve(null),
    staleTime: Number.POSITIVE_INFINITY,
  });

  return query;
};
