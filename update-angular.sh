#! /bin/sh
if [ -n "$1" ]; then
  mkdir tmp
  curl http://code.angularjs.org/$1/angular-$1.zip -L -o tmp/angular.zip
  rm -fr app/vendor/angular
  unzip tmp/angular.zip -d app/vendor
  mv app/vendor/angular-$1 app/vendor/angular
  rm -fr app/vendor/angular/docs tmp
else
  echo "Usage: update-angular <version>"
fi
