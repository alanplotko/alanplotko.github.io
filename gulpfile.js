const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const jsonmin = require('gulp-jsonmin');
const cleanCSS = require('gulp-clean-css');
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
            conservativeCollapse: true,
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            html5: true,
            processScripts: ['text/javascript']
        }))
        .pipe(gulp.dest('./_site'));
}

function minifyCSS() {
    return gulp.src('./_site/**/*.css')
        .pipe(cleanCSS({
            level: {
                2: {
                    mergeAdjacentRules: true, // controls adjacent rules merging; defaults to true
                    mergeIntoShorthands: true, // controls merging properties into shorthands; defaults to true
                    mergeMedia: true, // controls `@media` merging; defaults to true
                    mergeNonAdjacentRules: true, // controls non-adjacent rule merging; defaults to true
                    mergeSemantically: true, // controls semantic merging; defaults to false
                    overrideProperties: true, // controls property overriding based on understandability; defaults to true
                    removeEmpty: true, // controls removing empty rules and nested blocks; defaults to `true`
                    reduceNonAdjacentRules: true, // controls non-adjacent rule reducing; defaults to true
                    removeDuplicateFontRules: true, // controls duplicate `@font-face` removing; defaults to true
                    removeDuplicateMediaBlocks: true, // controls duplicate `@media` removing; defaults to true
                    removeDuplicateRules: true, // controls duplicate rules removing; defaults to true
                    removeUnusedAtRules: false, // controls unused at rule removing; defaults to false (available since 4.1.0)
                    restructureRules: false, // controls rule restructuring; defaults to false
                    skipProperties: [] // controls which properties won't be optimized, defaults to `[]` which means all will be optimized (since 4.1.0)
                }
            }
        }))
        .pipe(gulp.dest('./_site'));
}

function minifyJSON() {
    return gulp.src('./_site/**/*.json')
        .pipe(jsonmin())
        .pipe(gulp.dest('./_site'));
}

const build = gulp.series(gulp.parallel(minifyHTML, minifyCSS, minifyJSON), serviceWorker);

exports.default = build;
