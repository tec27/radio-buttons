var express = require('express')
  , path = require('path')

require('./gulpfile.js') // watch files for changes and rebuild client scripts

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
server.listen(3000, function() {
  console.log('Server listening on :3000')
})

io.sockets.on('connection', function (socket) {
  console.log('client connected.')
  socket.emit('buttons/play')
})
