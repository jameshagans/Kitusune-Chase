const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server); // Use the Server class

const players = {};

const star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
const scores = {
  blue: 0,
  red: 0
};

let connectedPlayers = 0;

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  console.log('a user connected');
  connectedPlayers++;

  if (connectedPlayers > 2) {
    console.log('player limit reached');
    socket.disconnect(true);
    return;
  }

  // create a new player and add it to our players object
  const playerLength = Object.keys(players);
  if (playerLength.length < 2) {
    if (playerLength.length === 0) {
      // Assign to red team if there are no players
      players[socket.id] = {
        rotation: 0,
        x: 356,
        y: 565,
        playerId: socket.id,
        team: 'red'
      };
    } else {
      // Assign to the opposite team if there is already a player
      const existingPlayer = players[playerLength[0]];
      const newPlayerTeam = existingPlayer.team === 'red' ? 'blue' : 'red';
      const newPlayerX = existingPlayer.team === 'red' ? 1376 : 356; // Change the x-coordinate for the opposite team
      players[socket.id] = {
        rotation: 0,
        x: newPlayerX,
        y: 565,
        playerId: socket.id,
        team: newPlayerTeam
      };
    }
  } else {
    console.log('player limit reached');
    socket.disconnect(true);
    return;
  }
  
  // ...
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  console.log('Players: ', players);

  // send the star object to the new player
  socket.emit('starLocation', star);
  // send the current scores
  socket.emit('scoreUpdate', scores);

  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);
  console.log('players:', players);


  socket.on('disconnect', function() {
    console.log('user disconnected: ', socket.id);

    // Decrement the number of connected players
    connectedPlayers--;
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnected', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function(movementData) {

    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);



    // socket.on('starCollected', function () {
    //   if (players[socket.id].team === 'red') {
    //     scores.red += 10;
    //   } else {
    //     scores.blue += 10;
    //   }
    //   star.x = Math.floor(Math.random() * 700) + 50;
    //   star.y = Math.floor(Math.random() * 500) + 50;
    //   io.emit('starLocation', star);
    //   io.emit('scoreUpdate', scores);
    // });
  });

});




server.listen(3000, function() {
  console.log(`Listening on ${server.address().port}`);
});
