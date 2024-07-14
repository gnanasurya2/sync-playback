import { useQuery } from "@tanstack/react-query"

export type IncomingRequest = {
        name: string;
        roomId: string;
        userId: string;
        toastShown: boolean;
    }
export const useAcceptIncomingRequest = () => {
    const query = useQuery<Array<IncomingRequest>>({
        queryKey: ['acceptIncomingRequest'],
        queryFn : () => Promise.resolve([]),
        staleTime: Number.POSITIVE_INFINITY
    });

    return query;
}