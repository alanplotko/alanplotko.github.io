const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const jsonmin = require('gulp-jsonmin');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify');
const purgecss = require('gulp-purgecss');
const mergeStream = require('merge-stream');
const cp = require('child_process');
const workboxBuild = require('workbox-build');

// Derive Jekyll environment from environment variable
const env = process.env.JEKYLL_ENV || 'development';

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
      processScripts: ['text/javascript'],
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true
    }))
    .pipe(gulp.dest('./_site'));
}

function buildSass() {
  const mainStyles = gulp.src('./assets/css/main.scss')
    .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(purgecss({
      content: ['./_site/index.html']
    }))
    .pipe(gulp.dest('./_site/assets/css', { overwrite: true }));
  const blogStyles = gulp.src('./assets/css/theme.scss')
    .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(purgecss({
      content: ['./_site/**/*.html', '!./_site/index.html']
    }))
    .pipe(gulp.dest('./_site/assets/css', { overwrite: true }));
  return mergeStream(mainStyles, blogStyles);
}

function buildJs() {
  return gulp.src('./assets/js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('./_site/assets/js', { overwrite: true }));
}

function buildJson() {
  return gulp.src('./_site/**/*.json')
    .pipe(jsonmin())
    .pipe(gulp.dest('./_site'));
}

function buildYaml(cb) {
  let jekyllFiles = ['_config/common.yml'];
  if (env === 'development') {
    jekyllFiles.push('_config/staging.yml');
  }
  jekyllFiles.push(`_config/${env}.yml`);
  cp.exec(`./node_modules/.bin/yaml-merge ${jekyllFiles.join(' ')} > _config-${env}.yml`, function (err, stdout, stderr) {
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
    cb(err);
  });
}

/**
 * Watch assets and rebuild Jekyll for local development
 */

function watchHtml() {
  let series = env == 'staging' ? gulp.series(buildJekyll, buildHtml, buildSass, serviceWorker) : gulp.series(buildJekyll, buildHtml, buildSass);
  gulp.watch(['./*.html', './_includes/*.html', './_layouts/*.html'], series);
}

function watchSass() {
  let series = env == 'staging' ? gulp.series(buildJekyll, buildHtml, buildSass, serviceWorker) : gulp.series(buildJekyll, buildHtml, buildSass);
  gulp.watch('./assets/css/**/*.{css,scss}', series);
}

function watchJs() {
  let series = env == 'staging' ? gulp.series(buildJekyll, buildJs, serviceWorker) : gulp.series(buildJekyll, buildJs);
  gulp.watch('./assets/js/*.js', series);
}

function watchJson() {
  let series = env == 'staging' ? gulp.series(buildJekyll, buildJson, serviceWorker) : gulp.series(buildJekyll, buildJson);
  gulp.watch('./assets/json/*.json', series);
}

function watchYaml() {
  let series = env == 'staging' ? gulp.series(buildYaml, buildJekyll, serviceWorker) : gulp.series(buildYaml, buildJekyll);
  gulp.watch('./_config/*.yml', series);
}

function buildJekyll(cb) {
  cp.exec(`bundle exec jekyll build --config _config-${env}.yml`, function (err, stdout, stderr) {
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
    cb(err);
  });
}

function serveJekyll(cb) {
  cp.exec(`bundle exec jekyll serve --skip-initial-build --config _config-${env}.yml`, function (err, stdout, stderr) {
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
    cb(err);
  });
}

// Build: build yaml, build Jekyll, and build assets together. For prod, additionally purge unused css and set up the service worker.
exports.build = (env == 'production' || env == 'staging') ?
  gulp.series(buildYaml, buildJekyll, gulp.parallel(buildHtml, buildSass, buildJs, buildJson), serviceWorker) :
  gulp.series(buildYaml, buildJekyll, gulp.parallel(buildHtml, buildSass, buildJs, buildJson));

// Serve: serve Jekyll only
exports.serve = serveJekyll;

// Watch: serve Jekyll, watch assets, and rebuild on changes
exports.watch = gulp.parallel(serveJekyll, watchHtml, watchSass, watchJs, watchJson, watchYaml);

// Build yaml only
exports.yaml = buildYaml;

// Default to build job
exports.default = exports.build;
