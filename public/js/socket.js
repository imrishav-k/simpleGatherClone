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

    this.socket.on('movementDetected', ()=>{
      // compare prevState with current state of nearbyPlayers to check if any player has left or entered the vicinity
      // This is required to avoid sending the same message multiple times or making webRTC connection(in future) multiple times
      let {added, removed} = Game.compareNearbyPlayersStates(Game.prevState, Game.nearbyPlayers);
      Game.prevState = JSON.parse(JSON.stringify(Game.nearbyPlayers));
      if(!added.length && !removed.length) {
        return;
      } else {
        if(added.length) {
          // add the player to webRTC connection
          this.socket.emit('nearbyPlayers', {nearbyPlayers: Game.nearbyPlayers, message: 'Hello from nearby player!'});
        } else if(removed.length) {
          // remove the player from webRTC connection
        }
      }
    });

    this.socket.on('message', (data) => {
      console.log("hahha: ",data);
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