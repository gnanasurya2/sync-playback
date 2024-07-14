import { useQuery } from '@tanstack/react-query';

export type JoinEventType = {
  roomId: string;
  isCreator: boolean;
};

export const useGetRoomId = () => {
  const query = useQuery<JoinEventType>({
    queryKey: ['getRoomId'],
    queryFn: () =>
      Promise.resolve({
        roomId: '',
        isCreator: false,
      }),
    staleTime: Number.POSITIVE_INFINITY,
  });

  return query;
};
