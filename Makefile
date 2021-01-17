package:
	rm -rf dist_package
	./node_modules/gulp/bin/gulp.js clean
	./node_modules/gulp/bin/gulp.js package
	cp -r dist dist_package
	find dist_package | grep "\.git\|DS_Store\|.swp" | xargs rm -rf
	cd dist_package && zip -r ../releases/webogram_v$(version).zip .

ghdist:
	rm -rf dist
	mkdir dist
	cp -r .git dist/
	cd dist && git checkout gh-pages

publish:
		./node_modules/gulp/bin/gulp.js clean
		cd dist && git pull origin gh-pages
		./node_modules/gulp/bin/gulp.js publish
		echo -n "Please open http://localhost:8000/dist/index.html and check if everything works fine." && read -e
		cd dist && git add --all . && git commit -am "merged with master" && git push origin gh-pages

bump:
	./node_modules/gulp/bin/gulp.js bump

txinstall:
	curl -O https://raw.githubusercontent.com/pypa/pip/master/contrib/get-pip.py
	sudo python get-pip.py
	sudo pip install transifex-client

txupdate:
	tx pull -f

txupload:
	tx pull -f
	tx push -s
