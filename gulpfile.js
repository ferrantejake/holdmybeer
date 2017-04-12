'use strict';

const gulp = require('gulp-help')(require('gulp-param')(require('gulp'), process.argv));
// const async = require('async');
const del = require('del');
const merge = require('merge2');

// const path = require('path');

// load gulp plugins
const G$ = require('gulp-load-plugins')({ lazy: true });

// load settings
const settings = require('./gulp.json');
const tsconfig = require('./tsconfig.json');
let tsProject = undefined;
let APP_NAME = process.env.APP_NAME;

const pack = require('./package.json');
// const exec = require('child_process').exec;

// DO NOT CHANGE DEFAULT TASK - Azure depends on it
gulp.task('default', false, defaultTask);

function defaultTask(callback) {
    if (APP_NAME)
        G$.sequence('startup', callback);
    else // not running in azure
        G$.sequence('help', callback);
}

gulp.task('startup', false, startupTask);

function startupTask(callback) {
    G$.sequence('clean-main', 'build-main', callback);
}

// Debug
gulp.task('debug', 'Run the project and auto-restart for changes', debugTask);

function debugTask(project, debug) {
    debug = debug || `${pack.name}:*`;
    console.log(`>> debug ${pack.name} application with DEBUG=${debug}`);
    G$.nodemon({

        script: `index.js`,
        ext: 'js',
        env: {
            NODE_ENV: 'development',
            DEBUG: debug
        },
        delay: 1, // Sec
        watch: `app`,
        ignore: `app/src`
    });
};

// Building
gulp.task('build', 'Compiles all TypeScript source files and updates module references', buildTask);
gulp.task('build-main', false, buildMainTask);

function buildTask(callback) {
    G$.sequence(['tslint', 'clean'], 'typescript', callback);
};

function buildMainTask(callback) {
    G$.sequence([], 'typescript', callback);
}

// Watching
gulp.task('watch', 'Contiuous build', ['build'], watchTask);

function watchTask() {
    gulp.watch(settings.watchfiles, ['tslint', `typescript`]);
}

// Cleaning
gulp.task('clean', 'Cleans the generated files from lib directory', cleanTask);
gulp.task('clean-main', false, cleanTask);

function cleanTask() {
    return del((settings.dest), { dot: true });
};

// Transpiling
gulp.task(`typescript`, `Transpile typescript files`, transpileTask);

function transpileTask() {
    tsProject = G$.typescript.createProject(tsconfig.compilerOptions);
    const tsResult = gulp.src(settings.tsfiles)
        .pipe(G$.sourcemaps.init())
        .pipe(tsProject());
    const dest = settings.dest;
    return merge([
        // .d.ts files
        tsResult.dts.pipe(gulp.dest(dest)),
        // .js files + sourcemaps
        settings.inlineSourcemaps ?
            tsResult.js
                .pipe(G$.sourcemaps.write()) // inline sourcemaps
                .pipe(gulp.dest(dest)) :
            tsResult.js
                .pipe(G$.sourcemaps.write('.')) // separate .js.map files
                .pipe(gulp.dest(dest)),
        // all other files
        gulp.src(settings.resources).pipe(gulp.dest(dest))
    ]);
}

// see https://www.npmjs.com/package/tslint
gulp.task('tslint', 'Lints all TypeScript source files', tslintTask);
function tslintTask() {
    return gulp.src(settings.tsfiles)
        .pipe(G$.tslint({
            formatter: 'verbose'
        }))
        .pipe(G$.tslint.report({
            emitError: false
        }));
}