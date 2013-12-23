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
