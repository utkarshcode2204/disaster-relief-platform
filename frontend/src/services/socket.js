import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export const registerUserRoom = (userId) => {
  if (userId) {
    socket.emit('register_user', userId);
  }
};

export default socket;