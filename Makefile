bump:
	sed -i.bak 's/"version": ".*",/"version": "$(version)",/g' app/manifest.json
	sed -i.bak 's/"version": ".*",/"version": "$(version)",/g' app/manifest.webapp
	sed -i.bak 's/<span class="settings_version">alpha .*<\/span>/<span class="settings_version">alpha $(version)<\/span>/g' app/partials/settings_modal.html
	rm app/manifest.json.bak app/manifest.webapp.bak app/partials/settings_modal.html.bak

package:
	rm -rf package_dist
	cp -r app package_dist
	sed -i.bak 's/<html lang="en" ng-app="myApp">\(<\!--  ng-csp=""  -->\)/<html lang="en" ng-app="myApp" ng-csp="">/g' package_dist/index.html
	sed -n -i.bak '1h;1!H;$${;g;s/<script>.*<\/script>/ /p;}' package_dist/index.html
	rm package_dist/index.html.bak
	rm package_dist/img/screenshot*
	find package_dist | grep DS_Store | xargs rm -rf
	cd package_dist && zip -r ../webogram_v$(version).zip .

publish:
	rm -rf dist/*
	cp -r app/* dist/
	cd dist
	git add .
	git commit -am "merged with master"
	git push origin gh-pages