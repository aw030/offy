const gulp = require("gulp");
const ts = require('gulp-typescript');
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const uglify = require("gulp-uglify");
const sass = require('gulp-sass');

sass.compiler = require('node-sass');

const paths = {
    source: "./src",
    build: "./build"
};

function cssBuild() {
    return gulp
    .src(`${paths.source}/scss/*.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([cssnano()]))
    .pipe(gulp.dest(`${paths.build}`));
}

function javascriptBuild() {
    return (
        gulp.src(paths.source + '/ts/*.ts')
        .pipe(ts({
            noImplicitAny: false,
            outFile: 'offy.js',
            lib: [
                "es2018",
                "dom"
            ]
        }))
        .pipe(uglify({
            mangle: {
                toplevel: true, reserved: ['Offy']}}))
        .pipe(gulp.dest('build'))
    );
}

function watch() {
  gulp.watch(paths.source + '/scss/*.scss', cssBuild);
  //watch(paths.source + '/js/*.ts', series(clean, javascriptBuild));
  gulp.watch(paths.source + '/ts/*.ts', javascriptBuild);
};

exports.default = exports.build = gulp.parallel(cssBuild, javascriptBuild, watch)
//exports.default = watch()