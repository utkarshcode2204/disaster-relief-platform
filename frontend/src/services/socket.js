import { io } from 'socket.io-client';

const socket = io('https://disaster-relief-backend-oale.onrender.com');

export default socket;