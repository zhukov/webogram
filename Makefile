package:
	./node_modules/gulp/bin/gulp.js clean
	./node_modules/gulp/bin/gulp.js package
	cp -r dist dist_package
	find dist_package | grep "\.git\|DS_Store" | xargs rm -rf
	cd dist_package && zip -r ../releases/webogram_v$(version).zip .

publish:
	./node_modules/gulp/bin/gulp.js clean
	cd dist && git pull origin gh-pages
	./node_modules/gulp/bin/gulp.js publish
	echo -n "Please open http://localhost:8000/dist/index.html and check if everything works fine." && read -e
	cd dist && git add --all . && git commit -am "merged with master" && git push origin gh-pages
