bump:
	sed -i.bak 's/"version": ".*",/"version": "$(version)",/g' app/manifest.json
	sed -i.bak 's/"version": ".*",/"version": "$(version)",/g' app/manifest.webapp
	sed -i.bak 's/<span class="settings_version">alpha .*<\/span>/<span class="settings_version">alpha $(version)<\/span>/g' app/partials/settings_modal.html
	grep -rl 'Webogram v' app | xargs -I {} sed -i.bak 's/Webogram v[0-9.]*/Webogram v$(version)/g' {}
	find app -name *.bak | xargs rm

package:
	rm -rf package_dist
	cp -r app package_dist
	sed -i.bak 's/<html lang="en" ng-app="myApp">\(<\!--  ng-csp=""  -->\)/<html lang="en" ng-app="myApp" ng-csp="">/g' package_dist/index.html
	# sed -n -i.bak '1h;1!H;$${;g;s/<script>.*<\/script>/ /p;}' package_dist/index.html
	rm package_dist/index.html.bak
	rm package_dist/img/screenshot*
	find package_dist | grep "DS_Store\|LICENSE\|README" | xargs rm -rf
	cd package_dist && zip -r ../webogram_v$(version).zip .

publish:
	rm -rf dist/*
	cd dist && git pull origin gh-pages
	./node_modules/gulp/bin/gulp.js publish
	cd dist && git add --all . && git commit -am "merged with master" && git push origin gh-pages
