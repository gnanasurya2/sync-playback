import { useAcceptIncomingRequest } from '@/api/socketEvents/acceptIncomingRequest';
import { EventType } from '@/api/socketEvents/types';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import { useWebSocket } from '@/context';
import { useEffect } from 'react';

export default () => {
  const { data: incomingRequests = [] } = useAcceptIncomingRequest();
  const { toast } = useToast();
  const { pushEvent } = useWebSocket();

  useEffect(() => {
    for (const req of incomingRequests) {
      if (!req.toastShown) {
        toast({
          title: `${req.name} is requesting to join the room`,
          action: (
            <ToastAction
              altText="Accept"
              onClick={() => {
                pushEvent(EventType.ACCEPT_JOIN_REQUEST, {
                  userId: req.userId,
                  name: req.name,
                });
              }}
            >
              Accept
            </ToastAction>
          ),
          duration: Number.POSITIVE_INFINITY,
        });
      }
    }
  }, [incomingRequests, toast, pushEvent]);

  return <></>;
};
