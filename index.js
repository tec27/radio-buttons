var express = require('express')
  , path = require('path')
  , runGulp = require('./gulp-runner')

runGulp()

var app = express()

app.set('views', path.resolve('./views'))
  .set('view engine', 'jade')
  .disable('x-powered-by')
  .use(express.json())
  .use(express.query())
  .use(express.cookieParser())
  .use(express.static(path.resolve('./public')))
  .use(app.router)

if (app.get('env') == 'development') {
  app.use(express.errorHandler())
}

app.get('/favicon.ico', function(req, res) { res.send(404) })
  .get('/robots.txt', function(req, res) { res.send(404) })
  .get('*', function(req, res) { res.render('index') })

var server = require('http').createServer(app)
  , io = require('socket.io').listen(server)

io.set('log level', 2)

server.listen(3000, function() {
  console.log('Server listening on :3000')
})

var buttonState = { play: false
                  , rewind: false
                  , forward: false
                  }
  , isPlaying = false

var players = io.of('/players')
  , remotes = io.of('/remotes')

players.on('connection', function (socket) {
  console.log('player connected.')
  socket.on('buttons/play/state', function(enabled) {
    buttonState.play = enabled
    remotes.emit('buttons/play/state', enabled)
  }).on('buttons/rewind/state', function(enabled) {
    buttonState.rewind = enabled
    remotes.emit('buttons/rewind/state', enabled)
  }).on('buttons/forward/state', function(enabled) {
    buttonState.forward = enabled
    remotes.emit('buttons/forward/state', enabled)
  }).on('playing', function(playing) {
    isPlaying = playing
    remotes.emit(playing ? 'playing' : 'paused')
  })
})

remotes.on('connection', function(socket) {
  console.log('remote connected.')

  Object.keys(buttonState).forEach(function(button) {
    socket.emit('buttons/' + button + '/state', buttonState[button])
  })
  socket.emit(isPlaying ? 'playing' : 'paused')

  ;['play', 'pause', 'rewind', 'forward'].forEach(function(action) {
    socket.on(action, function() {
      players.emit(action)
    })
  })
})
