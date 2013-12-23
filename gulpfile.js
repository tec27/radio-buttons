var gulp = require('gulp')
  , browserify = require('gulp-browserify')
  , concat = require('gulp-concat')
  , ngmin = require('gulp-ngmin')
  , rename = require('gulp-rename')
  , uglify = require('gulp-uglify')

gulp.task('scripts', function() {
  gulp.src('client/index.js')
    .pipe(browserify())
    .pipe(concat('client.js'))
    .pipe(gulp.dest('public/scripts/'))
    .pipe(ngmin())
    .pipe(uglify())
    .pipe(rename('client.min.js'))
    .pipe(gulp.dest('public/scripts/'))

  function bowerize(module) {
    return 'client_modules/' + module + '/' + module + '.js'
  }

  gulp.src(['angular', 'angular-animate', 'angular-route'].map(bowerize))
    .pipe(concat('angular.js'))
    .pipe(gulp.dest('public/scripts/'))
    .pipe(uglify())
    .pipe(rename('angular.min.js'))
    .pipe(gulp.dest('public/scripts/'))
})

gulp.task('default', function() {
  gulp.run('scripts')

  gulp.watch(['./client/**/*'], function(event) {
    gulp.run('scripts')
  })
})
