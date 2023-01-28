import autoprefixer from 'autoprefixer';
import browserSync from 'browser-sync';
import concat from 'gulp-concat';
import cssnano from 'cssnano';
import dartSass from 'sass';
import { deleteSync } from 'del';
import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import htmlmin from 'gulp-htmlmin';
import jsonmin from 'gulp-jsonmin';
import log from 'fancy-log';
import minify from 'gulp-minify';
import merge from 'merge-stream';
import postcss from 'gulp-postcss';
import purgecss from 'gulp-purgecss';
import run from 'gulp-run';
import workboxBuild from 'workbox-build';

const sass = gulpSass(dartSass);

// Service worker setup with workbox for precaching and runtime caching
const buildServiceWorker = (cb) => {
  workboxBuild.generateSW({
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
  cb();
}

// Process HTML
const buildHtml = () => {
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
    .pipe(gulp.dest('./_site', { overwrite: true }))
    .pipe(browserSync.stream())
    .on('error', log.error);
};

// Process styles, add vendor-prefixes, minify, then
// output the file to the appropriate location

const buildStyles = () => {
  // Main site (home page)
  const mainStyles = gulp.src('./assets/css/main.scss')
    .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(purgecss({
      content: ['./_site/index.html']
    }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest('./_site/assets/css'));

  // Blog
  const blogStyles = gulp.src('./assets/css/theme.scss')
    .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(purgecss({
      content: ['./_site/**/*.html', '!./_site/index.html']
    }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest('./_site/assets/css'));

  return merge(mainStyles, blogStyles)
    .pipe(browserSync.stream())
    .on('error', log.error);
}

// Build JSON
const buildJson = () => {
  return gulp.src('./assets/json/**/*.json')
    .pipe(jsonmin())
    .pipe(gulp.dest('./_site/assets/json'))
    .on('error', log.error);
}

// Concatenate and minify JS files and output the result to the appropriate location
const buildScripts = () => {
  return gulp.src('./assets/js/claps.js')
    .pipe(concat('posts.js'))
    .pipe(minify({ ext: { min: ".js" }, mangle: false, noSource: true }))
    .pipe(gulp.dest('./_site/assets/js'))
    .on('error', log.error);
}

// Run jekyll build commands
const jekyllDev = () => {
  return gulp.src('.')
    .pipe(run('bundle exec jekyll build --config "./_config/common.yml,./_config/development.yml"'))
    .on('error', log.error);
}

const jekyllStaging = () => {
  return gulp.src('.')
    .pipe(run('bundle exec jekyll build --config "./_config/common.yml,./_config/staging.yml"'))
    .on('error', log.error);
}

const jekyllProd = () => {
  return gulp.src('.')
    .pipe(run('bundle exec jekyll build --config "./_config/common.yml,./_config/production.yml"'))
    .on('error', log.error);
}

// Special tasks for building and reloading BrowserSync
const watchJekyll = gulp.series(jekyllDev, (cb) => {
  browserSync.reload();
  cb();
});

const watchScripts = gulp.series(buildScripts, (cb) => {
  browserSync.reload();
  cb();
});

// Delete the entire _site directory
gulp.task('clean', (cb) => {
  deleteSync(['./_site']);
  cb();
});

// Build site
gulp.task('dev', gulp.series('clean', jekyllDev, buildHtml, gulp.parallel(buildScripts, buildStyles, buildJson, buildServiceWorker)));
gulp.task('staging', gulp.series('clean', jekyllStaging, buildHtml, gulp.parallel(buildScripts, buildStyles, buildJson, buildServiceWorker)));
gulp.task('prod', gulp.series('clean', jekyllProd, buildHtml, gulp.parallel(buildScripts, buildStyles, buildJson, buildServiceWorker)));

const watch = () => {
  browserSync.init({
    server: {
      baseDir: './_site',
      serveStaticOptions: {
        extensions: ["html"]
      }
    },
    port: 4000,
    ui: {
      port: 4001
    },
    ghostMode: false, // Toggle to mirror clicks, reloads etc (performance)
    logFileChanges: true,
    logLevel: 'debug',
    open: true       // Toggle to auto-open page when starting
  });
  gulp.watch(['_config/**/*.yml'], gulp.series(watchJekyll));
  // Watch .scss files and pipe changes to browserSync
  gulp.watch('_assets/styles/**/*.scss', gulp.series(buildStyles));
  // Watch .js files
  gulp.watch('_assets/js/**/*.js', gulp.series(watchScripts));
  // Watch json files and pipe changes to browserSync
  gulp.watch('_assets/json/**/*.json', gulp.series(buildJson));
  // Watch posts
  gulp.watch('_posts/**/*.+(md|markdown|MD)', gulp.series(watchJekyll));
  // Watch html and markdown files
  gulp.watch(['**/*.+(html|md|markdown|MD)', '!_site/**/*.*'], gulp.series(buildHtml, watchJekyll));
  // Watch RSS feed
  gulp.watch('feed.xml', gulp.series(watchJekyll));
  // Watch data files
  gulp.watch('_data/**.*+(yml|yaml|csv|json)', gulp.series(watchJekyll));
}

// Serve site and watch files
gulp.task('watch', gulp.series('dev', watch));

// Default is to build dev site
gulp.task('default', gulp.series('dev'));
