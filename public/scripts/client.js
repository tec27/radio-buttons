;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = angular.module('radio-buttons',
  [ 'ngAnimate'
  , 'ngRoute'
  , require('./player')
  , require('./sockets')
  ])

app.config(function($locationProvider, $routeProvider) {
  $locationProvider.html5Mode('true').hashPrefix('!')
})

app.run(function(socket) {
  socket.connect()
})

},{"./player":2,"./sockets":3}],2:[function(require,module,exports){
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
  this.nowPlaying = {}

  socket.on('playing', function() {
    this.isPlaying = true
  }.bind(this))

  socket.on('paused', function() {
    this.isPlaying = false
  }.bind(this))

  socket.on('nowPlaying', function(data) {
    this.nowPlaying = data
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

},{"./sockets":3}],3:[function(require,module,exports){
var modname = module.exports = 'radio-buttons.sockets'

var mod = angular.module(modname, [])

mod.factory('socket', function($rootScope) {
  return new AngularSocket('/remotes', $rootScope)
})

function AngularSocket(host, $rootScope) {
  this.host = host
  this.scope = $rootScope
  this.connected = false
  this.lastError = null

  var self = this
  ;[ '_onConnect', '_onError', '_onDisconnect' ].forEach(function(func) {
    self[func] = self[func].bind(self)
  })

  this._socketListeners = []
  this._socketOnceListeners = []
}

AngularSocket.prototype.connect = function() {
  if (this.connected) return this

  if (!this.socket) {
    this.socket = io.connect(this.host)
    this.socket.on('connect', this._onConnect)
      .on('error', this._onError)
      .on('disconnect', this._onDisconnect)

    var i, len
    for (i = 0, len = this._socketListeners.length; i < len; i++) {
      this.socket.on(this._socketListeners[i].event, this._socketListeners[i].cb)
    }
    for (i = 0, len = this._socketOnceListeners.length; i < len; i++) {
      this.socket.once(this._socketOnceListeners[i].event, this._socketOnceListeners[i].cb)
    }
    this._socketOnceListeners = []
  } else {
    this.socket.socket.reconnect()
  }

  return this
}

AngularSocket.prototype.disconnect = function() {
  if (!this.connected || !this.socket) return this

  this.socket.disconnect()
  return this
}

AngularSocket.prototype._onConnect = function() {
  console.log('socket connected.')
  this.connected = true
  this.scope.$apply()
}

AngularSocket.prototype._onError = function(err) {
  console.log('socket error!')
  console.dir(err)
  var self = this
  this.scope.$apply(function() {
    self.lastError = err
  })
}

AngularSocket.prototype._onDisconnect = function() {
  console.log('socket disconnected.')
  var self = this
  // onDisconnect is called immediately (in the same event loop turn) if disconnected manually.
  // To prevent this from causing nested $digest loops, we defer $apply to the next turn.
  setTimeout(function() {
    self.connected = false
    self.scope.$apply()
  }, 0)
}

// Unlike the normal socket.io API, this returns a function that can be used to remove the listener
AngularSocket.prototype.on = function(eventName, cb) {
  var self = this
  var wrappedCb = function() {
    cb.apply(self, arguments)
    self.scope.$apply()
  }

  var listener = { event: eventName, cb: wrappedCb }
  this._socketListeners.push(listener)
  if (this.socket) {
    this.socket.on(eventName, wrappedCb)
  }

  var removed = false
  return function() {
    if (removed) return
    removed = true
    self.socket.removeListener(eventName, wrappedCb)
    var index = self._socketListeners.indexOf(listener)
    if (index >= 0) self._socketListeners.splice(index, 1)
  }
}

// Unlike the normal socket.io API, this returns a function that can be used to remove the listener
AngularSocket.prototype.once = function(eventName, cb) {
  var self = this
  var wrappedCb = function() {
    cb.apply(self, arguments)
    self.scope.$apply()
  }

  var listener
  if (this.socket) {
    this.socket.once(eventName, wrappedCb)
  } else {
    listener = { event: eventName, cb: wrappedCb }
    this._socketOnceListeners.push(listener)
  }

  var removed = false
  return function() {
    if (removed) return
    removed = true
    self.socket.removeListener(eventName, wrappedCb)
    var index = self._socketOnceListeners.indexOf(listener)
    if (index >= 0) self._socketOnceListeners.splice(index, 1)
  }
}

AngularSocket.prototype.emit = function(eventName) {
  if (!this.socket) return this

  var self = this
    , args = Array.prototype.slice.apply(arguments)
  if (typeof arguments[arguments.length - 1] == 'function') {
    var cb = args[args.length - 1]
    args[args.length - 1] = function() {
      cb.apply(self, arguments)
      self.scope.$apply()
    }
  }

  this.socket.emit.apply(this.socket, args)
  return this
}

},{}]},{},[1])
;