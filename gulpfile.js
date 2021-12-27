const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const jsonmin = require('gulp-jsonmin');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const del = require('del');
const workboxBuild = require('workbox-build');

function serviceWorker() {
    return workboxBuild.generateSW({
        skipWaiting: true,
        clientsClaim: true,
        globDirectory: '_site/',
        globPatterns: [
            '**/*.{png,ico,json,pdf,html,css,js,svg}'
        ],
        swDest: '_site/sw.js',
        runtimeCaching: [{
                urlPattern: /^https?:\/\/cdnjs.cloudflare.com/,
                handler: 'StaleWhileRevalidate',
            },
            {
                urlPattern: /^https?:\/\/fonts.googleapis.com/,
                handler: 'StaleWhileRevalidate',
            },
            {
                urlPattern: /^https?:\/\/fonts.gstatic.com/,
                handler: 'StaleWhileRevalidate',
            }
        ]
    });
}

function minifyHTML() {
    return gulp.src('./_site/**/*.{html,svg}')
        .pipe(htmlmin({
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            html5: true,
            processScripts: ['text/javascript']
        }))
        .pipe(gulp.dest('./_site'));
}

function minifyCSS() {
    return gulp.src(['./_site/assets/css/skeleton.css', './_site/assets/css/custom.css'])
        .pipe(concat('style.css'))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(gulp.dest('./_site/assets/css'));
}

function minifyJSON() {
    return gulp.src('./_site/**/*.json')
        .pipe(jsonmin())
        .pipe(gulp.dest('./_site'));
}

function cleanUp() {
    // Clean up source CSS files
    return del(['./_site/**/*.css', '!./_site/assets/css/style.css']);
}

const build = gulp.series(gulp.parallel(minifyHTML, minifyCSS, minifyJSON), cleanUp, serviceWorker);

exports.default = build;
