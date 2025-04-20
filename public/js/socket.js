let socketC = null;
class SocketClient {
  constructor() {
    this.socket = null;
    this.auth = new Auth();
    this.init();
  }

  init() {
    if (!this.auth.token) return;

    // Connect to Socket.IO server
    this.socket = io();

    // Authenticate with JWT
    this.socket.emit('authenticate', this.auth.token);

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });
  }
}

// Initialize SocketClient when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/dashboard.html') {
    socketC = new SocketClient();
  }
});