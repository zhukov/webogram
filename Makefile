package:
	./node_modules/gulp/bin/gulp.js package
	find dist | grep "DS_Store" | xargs rm -rf
	cd dist && zip -r ../releases/webogram_v$(version).zip .

publish:
	./node_modules/gulp/bin/gulp.js clean
	cd dist && git pull origin gh-pages
	./node_modules/gulp/bin/gulp.js publish
	cd dist && git add --all . && git commit -am "merged with master" && git push origin gh-pages
