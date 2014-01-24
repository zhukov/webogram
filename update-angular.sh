#! /bin/sh
if [ -n "$1" ]; then
  mkdir tmp
  curl https://raw.github.com/angular/code.angularjs.org/master/$1/angular-$1.zip -o tmp/angular.zip
  rm -fr app/vendor/angular
  unzip tmp/angular.zip -d app/vendor
  mv app/vendor/angular-$1 app/vendor/angular
  rm -fr app/vendor/angular/docs
else
  echo "Usage: update-angular <version>"
fi
