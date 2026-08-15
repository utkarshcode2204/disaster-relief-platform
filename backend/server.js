const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Custom lightweight sanitizer (express-mongo-sanitize is incompatible with
// newer Express versions where req.query is read-only)
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  }
  return obj;
};
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const messageRoutes = require('./routes/messageRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  next();
});

// Rate limiter for auth routes — prevents brute-force login/register attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per window
  message: { message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
app.get('/', (req, res) => {
  res.send('Disaster Relief API is running');
});
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/messages', messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_request', (requestId) => {
    socket.join(`request_${requestId}`);
  });

  socket.on('leave_request', (requestId) => {
    socket.leave(`request_${requestId}`);
  });
 socket.on('update_location', ({ requestId, lat, lng }) => {
    socket.to(`request_${requestId}`).emit('responder_location', { lat, lng });
  });
socket.on('register_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})