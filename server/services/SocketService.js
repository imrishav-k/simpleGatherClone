const io = require('socket.io');
class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = {};
  }

  initialize(server) {
    this.io = io(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Handle user authentication with JWT
      socket.on('authenticate', (token) => {
        try {
          const decoded = require('./AuthService').verifyToken(token);
          this.connectedUsers[socket.id] = {
            x: 100,
            y: 100,
            id: socket.id,
            username: decoded.username
          };
          console.log(`User authenticated: ${socket.id}`);
        } catch (err) {
          console.error('Authentication error:', err.message);
        }
      });

      socket.on('ready', ()=>{
        // Send all players to the new player
        socket.emit('currentPlayers', this.connectedUsers);
      
        // Tell everyone else about the new player
        socket.broadcast.emit('newPlayer', this.connectedUsers[socket.id]);
      
        // Listen for player movement
        socket.on('playerMovement', (data) => {
          if(this.connectedUsers[socket.id]) {
            this.connectedUsers[socket.id].x = data.x;
            this.connectedUsers[socket.id].y = data.y;
            socket.broadcast.emit('playerMoved', this.connectedUsers[socket.id]);
            this.io.emit('movementDetected', this.connectedUsers);
          }
        });

        socket.on('nearbyPlayers', (data) => {
          for(const id in data.nearbyPlayers) {
            socket.to(id).emit('message', data.message);
          }
        });
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete this.connectedUsers[socket.id];
        this.io.emit('playerDisconnected', socket.id);
      });
    });
  }

  getIO() {
    if (!this.io) {
      throw new Error('Socket.io not initialized');
    }
    return this.io;
  }

  getUserSocket(userId) {
    return this.connectedUsers[userId];
  }

  emitToUser(userId, event, data) {
    const socketId = this.getUserSocket(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

module.exports = new SocketService();