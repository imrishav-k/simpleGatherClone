const HEIGHT = 600;
const WIDTH = 1024;
const PLAYER_SPEED = 200;

class FirstScene extends Phaser.Scene {
  constructor(){
    super('FirstScene');
  }

  preload() {
    this.load.image('map', 'assets/map.png');
    this.load.spritesheet('avatar', 'assets/avatar.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }
  
  create() {
    const scene = this;
    this.add.image(WIDTH/2, HEIGHT/2, 'map'); // Center the map
    Game.cursors = this.input.keyboard.createCursorKeys();
    if(socketC.socket.connected) {
      socketC.socket.on('currentPlayers', function(serverPlayers) {
        Game.myId = socketC.socket.id;
        for(const id in serverPlayers) {
          const p = serverPlayers[id];
          Game.addPlayer(scene, p);
        }
      });
      
      socketC.socket.on('newPlayer', (data) => {
        Game.addPlayer(scene, data);
      });
      
      socketC.socket.on('playerMoved', function(data) {
        if(Game.players[data.id]) {
          Game.players[data.id].player.setPosition(data.x, data.y);
          Game.players[data.id].nameText.setPosition(data.x, data.y-20);
          if(Game.inVicinity(Game.players[Game.myId].player, Game.players[data.id].player)) {
            Game.nearbyPlayers[data.id] = Game.players[data.id];
          } else if(Game.nearbyPlayers[data.id]) {
            delete Game.nearbyPlayers[data.id];
          }
        }
      });
      
      socketC.socket.on('playerDisconnected', function(id) {
        if(Game.players[id]) {
          Game.players[id].player.destroy();
          Game.players[id].nameText.destroy();
          delete Game.players[id];
        }
      });
      socketC.socket.emit('ready', 'ready');
    }
  }

  update() {
    if(!Game.myId || !Game.players[Game.myId]) {return;}
    let player = Game.players[Game.myId].player;
    let nameText = Game.players[Game.myId].nameText;
    nameText.setPosition(player.x, player.y - 20);
    player.setVelocity(0);
    let moved = false;

    if(Game.cursors.left.isDown) {
      player.setVelocityX(-PLAYER_SPEED);
      moved = true;
    } else if(Game.cursors.right.isDown) {
      player.setVelocityX(PLAYER_SPEED);
      moved = true;
    }
    
    if(Game.cursors.up.isDown) {
      player.setVelocityY(-PLAYER_SPEED);
      moved = true;
    } else if(Game.cursors.down.isDown) {
      player.setVelocityY(PLAYER_SPEED);
      moved = true;
    }
    if(moved) {
      nameText.setPosition(player.x, player.y - 20);
      for(const id in Game.players) {
        if(Game.players[id].player !== player) {
          if(Game.inVicinity(player, Game.players[id].player)) {
            Game.nearbyPlayers[id] = Game.players[id];
          } else if(Game.nearbyPlayers[id]) {
            delete Game.nearbyPlayers[id];
          }
        }
      }
      socketC.socket.emit('playerMovement', { x: player.x, y: player.y });
    }
  }
}

class Game {
  static myId;
  static players = {};
  static cursors;
  static nearbyPlayers = {};
  static prevState = {};

  config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: {
        debug: true,
      },
    },
    scene: [FirstScene]
  };

  constructor() {
    this.game = new Phaser.Game(this.config);
  }

  static addPlayer(scene, playerData) {
    const player = scene.physics.add.sprite(playerData.x, playerData.y, 'avatar', 0);
    const nameText = scene.add.text(playerData.x, playerData.y - 20, playerData.username || 'Player', {
      font: '12px Arial',
      fill: '#fff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    player.body.setCollideWorldBounds(true);
    Game.players[playerData.id] = { player, nameText };
  }

  static inVicinity(player1, player2) {
    const distance = Phaser.Math.Distance.Between(player1.x, player1.y, player2.x, player2.y);
    return distance < 100;
  }

  static compareNearbyPlayersStates(prevState, currState) {
    const added = Object.keys(currState).filter(id => !prevState[id]);
    const removed = Object.keys(prevState).filter(id => !currState[id]);
    return { added, removed };
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});