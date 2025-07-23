import { useQuery } from '@tanstack/react-query';
import type { GetRoomsResponse } from './types/get-rooms-response';

export function useRoom(roomId: string | undefined) {
  return useQuery({
    queryKey: ['get-room', roomId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3333/rooms/${roomId}`);
      const result: GetRoomsResponse = await response.json();

      return result;
    },
  });
}
