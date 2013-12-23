// Runs gulp on our gulpfile, so that client scripts can rebuilt when they change while running.
// Mostly copied and slightly modified from the gulp CLI.
var gulp = require('gulp')
  , gutil = require('gulp-util')
  , prettyTime = require('pretty-hrtime')

// run gulp so that client scripts get rebuilt when files change
require('./gulpfile.js')
gulp.on('task_start', function(e) {
  gutil.log('Running', '\'' + gutil.colors.cyan(e.task) + '\'...')
}).on('task_stop', function(e) {
  var time = prettyTime(e.hrDuration);
  gutil.log('Finished', '\'' + gutil.colors.cyan(e.task) + '\'', 'in', gutil.colors.magenta(time))
}).on('task_err', function(e) {
  var msg = formatError(e)
    , time = prettyTime(e.hrDuration)
  gutil.log('Errored',
    '\'' + gutil.colors.cyan(e.task) + '\'', 'in',
    gutil.colors.magenta(time), gutil.colors.red(msg))
})

function formatError (e) {
  if (!e.err) return e.message
  if (e.err.message) return e.err.message
  return JSON.stringify(e.err)
}

module.exports = function() {
  gulp.run()
}
