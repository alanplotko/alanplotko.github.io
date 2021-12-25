all: build serve

build: site gulp

site:
	bundle exec jekyll build --config _config-dev.yml

gulp:
	./node_modules/.bin/gulp

serve:
	bundle exec jekyll serve --skip-initial-build --no-watch

test: lighthouse-all

lighthouse-all: lighthouse-desktop lighthouse-mobile

lighthouse-desktop:
	lighthouse http://localhost:4000 --preset=desktop --quiet --chrome-flags="--headless" --view --output-path ./reports/lighthouse-desktop.html

lighthouse-mobile:
	lighthouse http://localhost:4000 --quiet --chrome-flags="--headless" --view --output-path ./reports/lighthouse-mobile.html
