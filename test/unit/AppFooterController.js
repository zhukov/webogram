describe('AppFooterController', function() {
  var $controller, $rootScope, $scope, $location, service, serviceFlag;

  beforeEach(module('myApp.controllers'));

  beforeEach(function () {
    serviceFlag = false;
    service = {
      switchLayout: function(parameter){
        serviceFlag = true;
      }
    }

    inject(function (_$controller_, _$rootScope_, _$location_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $location = _$location_;

        $scope = $rootScope.$new();
        $controller('AppFooterController', {
            $scope: $scope,
            LayoutSwitchService: service
        });
    });
  });

  // define tests
  it('compiles', function (done) {
    expect(true).toBe(true);
    done();
  });

  it('calls the right function', function (done) {
    expect(serviceFlag).toBe(false);
    $scope.switchLayout(null);
    expect(serviceFlag).toBe(true);
    done();
  });
})
