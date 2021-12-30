const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const jsonmin = require('gulp-jsonmin');
const sass = require('gulp-sass')(require('sass'));
const purgecss = require('gulp-purgecss');
const cp = require('child_process');
const workboxBuild = require('workbox-build');

// Derive Jekyll environment from environment variable
const env = process.env.JEKYLL_ENV == 'production' ? 'prod' : 'dev';

/**
 * Service worker setup with workbox for precaching and runtime caching
 */

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

/**
 * Build assets
 */

function buildHtml() {
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

function buildSass() {
    return gulp.src('./assets/css/*.scss')
        .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(gulp.dest('./_site/assets/css'));
}

function buildJson() {
    return gulp.src('./_site/**/*.json')
        .pipe(jsonmin())
        .pipe(gulp.dest('./_site'));
}


function buildYaml(cb) {
    cp.exec(`./node_modules/.bin/yaml-merge _config/common.yml _config/${env}.yml > _config-${env}.yml`, function(err, stdout, stderr) {
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        cb(err);
    });
}

/**
 * Purge unused CSS to minimize resource size in production
 */

function cleanCSS() {
    return gulp.src('./_site/**/*.css')
        .pipe(purgecss({
            content: ['./_site/**/*.html']
        }))
        .pipe(gulp.dest('./_site'));
}

/**
 * Watch assets and rebuild Jekyll for local development
 */

function watchHtml() {
    gulp.watch(['./*.html', './_includes/*.html', './_layouts/*.html'], gulp.series(buildJekyll, buildHtml));
}

function watchSass() {
    gulp.watch('./assets/css/*.{css,scss}', gulp.series(buildJekyll, buildSass));
}

function watchJson() {
    gulp.watch('./assets/json/*.json', gulp.series(buildJekyll, buildJson));
}

function watchYaml() {
    gulp.watch('./_config/*.yml', gulp.series(buildYaml, buildJekyll));
}

function buildJekyll(cb) {
    cp.exec(`bundle exec jekyll build --config _config-${env}.yml`, function(err, stdout, stderr) {
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        cb(err);
    });
}

function serveJekyll(cb) {
    cp.exec(`bundle exec jekyll serve --skip-initial-build --config _config-${env}.yml`, function(err, stdout, stderr) {
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        cb(err);
    });
}

// Build: build yaml, build Jekyll, and build assets together. For prod, additionally purge unused css and set up the service worker.
exports.build = env == 'prod' ?
    gulp.series(buildYaml, buildJekyll, gulp.parallel(buildHtml, buildSass, buildJson), cleanCSS, serviceWorker) :
    gulp.series(buildYaml, buildJekyll, gulp.parallel(buildHtml, buildSass, buildJson));

// Serve: serve Jekyll, watch assets, and rebuild on changes.
exports.serve = gulp.parallel(serveJekyll, watchHtml, watchSass, watchJson, watchYaml);

// Build yaml only
exports.yaml = buildYaml;

// Default to build job
exports.default = exports.build;
