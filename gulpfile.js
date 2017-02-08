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

// const exec = require('child_process').exec;

gulp.task('debug', 'Run the project and auto-restart for changes', function (project, debug) {
    debug = debug || 'weather-stats:*';
    console.log(`>> debug weather-stats application with DEBUG=${debug}`);
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
}, {
        options: {
            project: `Project name: weather-stats`
        }
    });


// Building

gulp.task('build', 'Compiles all TypeScript source files and updates module references', function (callback) {
    G$.sequence(['tslint', 'clean'], 'typescript', callback);
});

// Watching

gulp.task('watch', 'Contiuous build', ['build'], function () {
    gulp.watch(settings.src, ['tslint', `typescript`]);
});

// Cleaning

gulp.task('clean', 'Cleans the generated files from lib directory', function () {
    return del((settings.dest), { dot: true });
});

// Transpiling

gulp.task(`typescript`, `Transpile typescript files`, function () {
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
});

// see https://www.npmjs.com/package/tslint
gulp.task('tslint', 'Lints all TypeScript source files', function () {
    return gulp.src(settings.tsfiles)
        .pipe(G$.tslint({
            formatter: 'verbose'
        }))
        .pipe(G$.tslint.report({
            emitError: false
        }));
});