import { io } from 'socket.io-client';

const socket = io('https://disaster-relief-backend-oale.onrender.com');

export const registerUserRoom = (userId) => {
  if (userId) {
    socket.emit('register_user', userId);
  }
};

export default socket;