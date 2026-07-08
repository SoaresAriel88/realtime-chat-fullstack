import type { User } from '../types/chat';

export const currentUser: User = {
  id: import.meta.env.VITE_USER_ID ?? '0ac5e452-59f4-485d-b2d6-fad991fbfc8f',
  name: import.meta.env.VITE_USER_NAME ?? 'Ariel',
  status: 'online',
};
