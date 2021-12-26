const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const jsonmin = require('gulp-jsonmin');
const workboxBuild = require('workbox-build');

function serviceWorker() {
    return workboxBuild.generateSW({
        globDirectory: '_site/',
        globPatterns: [
            '**/*.{png,ico,json,pdf,html,js,svg}'
        ],
        swDest: '_site/sw.js',
        ignoreURLParametersMatching: [
            /^utm_/,
            /^fbclid$/
        ],
        runtimeCaching: [
            {
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

function minifyHtml() {
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


function minifyJson() {
    return gulp.src('./_site/**/*.json')
        .pipe(jsonmin())
        .pipe(gulp.dest('./_site'));
}

const build = gulp.series(gulp.parallel(minifyHtml, minifyJson), serviceWorker);

exports.default = build;
