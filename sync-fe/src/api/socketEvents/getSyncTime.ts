import { useQuery } from '@tanstack/react-query';

export type SyncTimeResponse = {
  originTimestamp: number;
  receiveTimestamp: number;
  transmitTimestamp: number;
};

export const useGetSyncedTime = () => {
  const query = useQuery<SyncTimeResponse | null>({
    queryKey: ['syncTimeResponse'],
    queryFn: () => Promise.resolve(null),
    staleTime: Number.POSITIVE_INFINITY,
  });

  return query;
};
