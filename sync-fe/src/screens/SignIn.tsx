import { useGetRoomId } from '@/api/socketEvents/getRoomId';
import { EventType } from '@/api/socketEvents/types';
import ThemeSelector from '@/components/custom/theme-selector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthContext, SocketState, useWebSocket } from '@/context';
import { ReloadIcon } from '@radix-ui/react-icons';
import { type ChangeEvent, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

enum tabs {
  createRoom = 'createRoom',
  joinRoom = 'joinRoom',
}

const TAB_BUTTON_TEXT: Record<tabs, string> = {
  [tabs.joinRoom]: 'Join Room',
  [tabs.createRoom]: 'Create Room',
};

export default () => {
  const [selectedTab, setSelectedTab] = useState(tabs.joinRoom);
  const [formData, setFormData] = useState({
    name: '',
    roomId: '',
    password: '',
  });

  const { state, pushEvent, shouldConnectHandler } = useWebSocket();
  const { data: signInData } = useGetRoomId();
  const { data, setAuthData } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (signInData) {
      setAuthData({
        roomId: signInData.roomId,
        isCreator: signInData.isCreator,
        name: formData.name,
      });
    }
  }, [signInData, formData.name, setAuthData]);

  useEffect(() => {
    if (data.roomId) {
      navigate(`/room/${data.roomId}`, { replace: true });
    }
  }, [data.roomId, navigate]);

  useEffect(() => {
    if (state === SocketState.READY) {
      selectedTab === tabs.joinRoom
        ? pushEvent(EventType.JOIN_ROOM, {
            roomId: formData.roomId,
            name: formData.name,
          })
        : pushEvent(EventType.CREATE_ROOM, {
            password: formData.password,
          });
    } else if (state === SocketState.CLOSED) {
      shouldConnectHandler(false);
    }
  }, [
    state,
    pushEvent,
    shouldConnectHandler,
    selectedTab,
    formData.name,
    formData.roomId,
    formData.password,
  ]);

  const submitHandler = (type: tabs) => {
    console.log('action type', type);
    shouldConnectHandler(true);
  };

  const onChangeHandler = (
    event: ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const value = event.target.value;

    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="w-screen h-screen flex">
      <div className="hidden lg:block flex-1 animate-bg-gradient bg-[length:400%_400%] bg-gradient-bg border-r-2 border-slate-600 " />
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end my-2">
          <ThemeSelector />
        </div>
        <div className="flex justify-center items-center flex-col flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Sync playback</CardTitle>
              <CardDescription>
                Sync video playback between devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue={tabs.joinRoom}
                className="lg:w-[400px]"
                value={selectedTab}
                onValueChange={(value) =>
                  (state === SocketState.UNINSTANTIATED ||
                    state === SocketState.CLOSED) &&
                  setSelectedTab(value as tabs)
                }
              >
                <TabsList className="w-full">
                  <TabsTrigger value={tabs.joinRoom} className="w-full">
                    Join Room
                  </TabsTrigger>
                  <TabsTrigger value={tabs.createRoom} className="w-full">
                    Create Room
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={tabs.joinRoom}>
                  <div className="space-y-1">
                    <Label htmlFor="username">Name</Label>
                    <Input
                      id="username"
                      placeholder="name"
                      value={formData.name}
                      onChange={(e) => onChangeHandler(e, 'name')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="RoomId">Room Id</Label>
                    <Input
                      id="RoomId"
                      placeholder="Room Id"
                      value={formData.roomId}
                      onChange={(e) => onChangeHandler(e, 'roomId')}
                    />
                  </div>
                </TabsContent>
                <TabsContent value={tabs.createRoom}>
                  <div className="space-y-1">
                    <Label htmlFor="username">Name</Label>
                    <Input id="username" placeholder="name" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="username">Password</Label>
                    <Input
                      id="username"
                      placeholder="password"
                      value={formData.password}
                      onChange={(e) => onChangeHandler(e, 'password')}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full mx-4"
                onClick={() => submitHandler(selectedTab)}
                disabled={state === SocketState.CONNECTING}
              >
                {state === SocketState.CONNECTING && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}

                {TAB_BUTTON_TEXT[selectedTab]}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
