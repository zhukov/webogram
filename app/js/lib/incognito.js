angular.module('incognito', [])

  .factory('InAPIConfigurator', function() {
    return {
      chooseServer: function() {
        return (`${Config.Incognito.serverUrl}/${Config.Incognito.basePath}`)
      }
    }
  })

  .factory('InAPIManager',
    function($rootScope, $http, $q, $modalStack, InAPIConfigurator, ErrorService) {
      delete $http.defaults.headers.post['Content-Type']
      delete $http.defaults.headers.common['Accept']
      $http.defaults.headers.common['Content-Type'] = 'application/json';
      var url = InAPIConfigurator.chooseServer();

      function errorHandler(error) {
        var modalData = {
          title: (error.statusText || "Server error"),
          description: (error.data?.message || "Internal server error occured. Please try again later.")
        }

        ErrorService.show(modalData).result.finally(function() {
          $modalStack.dismiss($modalStack.getTop().key);
        })
      }

      function authenticateUser(userId, name) {
        return $http.post(`${url}/account`,
          { id: userId, name }).then(
          function(result) {
            return result.data;
          },
          function(error) {
            errorHandler(error);
            return $q.reject(error)
          }
        )
      }

      function getAccountInfo(userId, account) {
        return $http.get(`${url}/account/${userId}/${account}`).then(
          function(result) {
            return result.data;
          },
          function(error) {
            errorHandler(error);
            return $q.reject(error)
          }
        )
      }

      function importAccount(userId, name, privateKey) {
        return $http.post(`${url}/account/${userId}`,
          { name, privateKey }).then(
          function(result) {
            return result.data;
          },
          function(error) {
            errorHandler(error);
            return $q.reject(error)
          }
        )
      }

      function createAccount(userId, name) {
        return $http.post(`${url}/account/${userId}`,
          { name }).then(
          function(result) {
            return result.data;
          },
          function(error) {
            errorHandler(error);
            return $q.reject(error)
          }
        )
      }

      function deleteAccount(userId, name) {
        return $http.delete(`${url}/account/${userId}/${name}`).then(
          function(result) {
            return result.data;
          },
          function(error) {
            errorHandler(error);
            return $q.reject(error)
          }
        )
      }

      return {
        authUser: authenticateUser,
        getAccountInfo: getAccountInfo,
        importAccount: importAccount,
        deleteAccount: deleteAccount,
        createAccount: createAccount
      }
    })
