angular.module('incognito', [])

  .factory('InAPIConfigurator', function() {
    return {
      chooseServer: function() {
        return ('http://localhost:8080')
      }
    }
  })

  .factory('InAPIManager', function(InAPIConfigurator, $http, $q) {
    delete $http.defaults.headers.post['Content-Type']
    delete $http.defaults.headers.common['Accept']

    function getAccountData() {
      // var url = InAPIConfigurator.chooseServer();
      try {
        // requestPromise = $http.get(url);
        var requestPromise = new Promise(function(resolve, reject) {
          resolve(
            {
              data: {
                accounts: {
                  Anon: {
                    balance: 0,
                    address: "12S3CcAtftrYJn1woQVUx94RdcTTRXoSyFM76wjyTesf6AvhMPw94u16TUJCdubsQMuu7J9L4pzukxY1DxqVFv91Y72b3LoDgRKKknJ",
                    privateKey: "112t8rnXB9Tej38VBMAYMQGZz1KUaKYbhqDQpdBwga2aGF92GNULFW8buLFidMvxZJvQvDVyfZCU8T8KJ6vb7sRDCbJg81QeoJJC3EgLuvfT",
                    publicKey: "12WHkqsGtbZ66xS8iawqruhN7DyHv6jgBAmEb9PiyrAsiehei4E",
                    readOnlyKey: "13henmYoRgvwKVgRRUfqnq3MZLVedYny5TYvMvQZYbzu1Ys6Y8MBEaE4GmyJwQnZQ5j1fHTbSLMrFz2vV7TcRUvNphk8ZY6vWnDbCT6",
                    validatorKey: "1kitnhgpfRyg8VHLWxb2jrirYm1gnM1sr8AK9fc2zoHJd8vPYm",
                    wallets: [
                      {
                        name: "Privacy",
                        symbol: "RPV",
                        balance: 0,
                        verified: true
                      },
                      {
                        name: "Ethereum",
                        symbol: "ETH",
                        balance: 0,
                        price: 356.2051,
                        verified: true
                      },
                      {
                        name: "Bitcoin",
                        symbol: "BTC",
                        balance: 0,
                        price: 10609.6427,
                        verified: true
                      },
                      {
                        name: "Tether USD",
                        symbol: "USDT",
                        balance: 0,
                        price: 0.581684746,
                        verified: false
                      }
                    ]
                  }
                }
              }
            }
          );
        });
      }
      catch (e) {
        console.log(e)
      }
      return requestPromise.then(
        function(result) {
          try {
            // var deserializer = new TLDeserialization(result.data);
            return result.data
          }
          catch (e) {
            console.log(e)
          }
        },
        function(error) {
          console.log(error);
          return $q.reject(error)
        }
      )
    }

    return {
      getAccountData: getAccountData
    }
  })
