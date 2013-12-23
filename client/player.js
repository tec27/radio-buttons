var modname = module.exports = 'radio-buttons.player'
var mod = angular.module(modname, [ require('./sockets') ])

mod.factory('buttonState', function(socket) {
  return new ButtonStateTracker(socket)
})

function ButtonStateTracker(socket) {
  this._socket = socket
  this.playPause = false
  this.rewind = false
  this.forward = false

  socket.on('buttons/play/state', function(enabled) {
    this.playPause = enabled
  }.bind(this))

  socket.on('buttons/rewind/state', function(enabled) {
    this.rewind = enabled
  }.bind(this))

  socket.on('buttons/forward/state', function(enabled) {
    this.forward = enabled
  }.bind(this))
}

mod.factory('playerState', function(socket) {
  return new PlayerStateTracker(socket)
})

function PlayerStateTracker(socket) {
  this._socket = socket
  this.isPlaying = false

  socket.on('playing', function() {
    this.isPlaying = true
  }.bind(this))

  socket.on('paused', function() {
    this.isPlaying = false
  }.bind(this))
}

mod.controller('PlayerCtrl', function($scope, buttonState, playerState, socket) {
  $scope.buttonState = buttonState
  $scope.playerState = playerState

  $scope.rewind = function() {
    socket.emit('rewind')
  }

  $scope.playOrPause = function() {
    socket.emit(playerState.isPlaying ? 'pause' : 'play')
  }

  $scope.forward = function() {
    socket.emit('forward')
  }
})
