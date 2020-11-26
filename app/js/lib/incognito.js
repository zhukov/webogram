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

    function getAccountInfo(account) {
      var mockData = {
        Anon: {
          balance: 0,
          address: "12S3CcAtftrYJn1woQVUx94RdcTTRXoSyFM76wjyTesf6AvhMPw94u16TUJCdubsQMuu7J9L4pzukxY1DxqVFv91Y72b3LoDgRKKknJ",
          keys: {
            privateKey: "112t8rnXB9Tej38VBMAYMQGZz1KUaKYbhqDQpdBwga2aGF92GNULFW8buLFidMvxZJvQvDVyfZCU8T8KJ6vb7sRDCbJg81QeoJJC3EgLuvfT",
            publicKey: "12WHkqsGtbZ66xS8iawqruhN7DyHv6jgBAmEb9PiyrAsiehei4E",
            readOnlyKey: "13henmYoRgvwKVgRRUfqnq3MZLVedYny5TYvMvQZYbzu1Ys6Y8MBEaE4GmyJwQnZQ5j1fHTbSLMrFz2vV7TcRUvNphk8ZY6vWnDbCT6",
            validatorKey: "1kitnhgpfRyg8VHLWxb2jrirYm1gnM1sr8AK9fc2zoHJd8vPYm",
          },
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
            },
            {
              name: "Tether USD",
              symbol: "USDT",
              balance: 0,
              price: 0.581684746,
              verified: false
            }
          ]
        },
        pDEX: {
          balance: 2,
          address: "12S1JXdHZFTGon2C1sZCE59noGRA6rL6qoo9Rf6fberdni2ezwstj9HLCzPPqy3ojUkk8PGMADhyR7tWDewLZmKGW6vK7RF8ZjVAJyF",
          keys: {
            privateKey: "112t8rnXB9Tej38VBMAYMQGZz1KUaKYbhqDQpdBwga2aGF92GNULFW8buLFidMvxZJvQvDVyfZCU8T8KJ6vb7sRDCbJg81QeoJJC3EgLuvfT",
            publicKey: "12WHkqsGtbZ66xS8iawqruhN7DyHv6jgBAmEb9PiyrAsiehei4E",
            readOnlyKey: "13henmYoRgvwKVgRRUfqnq3MZLVedYny5TYvMvQZYbzu1Ys6Y8MBEaE4GmyJwQnZQ5j1fHTbSLMrFz2vV7TcRUvNphk8ZY6vWnDbCT6",
            validatorKey: "1kitnhgpfRyg8VHLWxb2jrirYm1gnM1sr8AK9fc2zoHJd8vPYm",
          },
          wallets: [
            {
              name: "Privacy",
              symbol: "RPV",
              balance: 0,
              verified: true
            },
            {
              name: "Bitcoin",
              symbol: "BTC",
              balance: 0,
              price: 10609.6427,
              verified: true
            }
          ]
        },
        pDEXWithdraw: {
          balance: 4.3,
          address: "12RuZPdB1jvroAnqwpZweSW4QJbTEi34x58TP8CnEpCjHV5wrHaTdPPRieYtBe7ZUn6F37nv7scPf4hNLJ3XbrsyywgMWiufEAedJmf",
          keys: {
            privateKey: "112t8rnXB9Tej38VBMAYMQGZz1KUaKYbhqDQpdBwga2aGF92GNULFW8buLFidMvxZJvQvDVyfZCU8T8KJ6vb7sRDCbJg81QeoJJC3EgLuvfT",
            publicKey: "12WHkqsGtbZ66xS8iawqruhN7DyHv6jgBAmEb9PiyrAsiehei4E",
            readOnlyKey: "13henmYoRgvwKVgRRUfqnq3MZLVedYny5TYvMvQZYbzu1Ys6Y8MBEaE4GmyJwQnZQ5j1fHTbSLMrFz2vV7TcRUvNphk8ZY6vWnDbCT6",
            validatorKey: "1kitnhgpfRyg8VHLWxb2jrirYm1gnM1sr8AK9fc2zoHJd8vPYm",
          },
          wallets: [
            {
              name: "Privacy",
              symbol: "RPV",
              balance: 0,
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
      // var url = InAPIConfigurator.chooseServer();
      try {
        // requestPromise = $http.get(url);
        var requestPromise = new Promise(function(resolve, reject) {
          var result = {
            data: {
              account: mockData[account]
            }
          }
          result.data.account.name = account;
          resolve(result);
        });
      }
      catch (e) {
        console.log(e)
      }
      return requestPromise.then(
        function(result) {
          try {
            // var deserializer = new TLDeserialization(result.data);
            console.log(result)
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

    function getAccounts() {
      // var url = InAPIConfigurator.chooseServer();
      try {
        // requestPromise = $http.get(url);
        var requestPromise = new Promise(function(resolve, reject) {
          resolve(
            {
              data: {
                accounts: [
                  {
                    name: 'Anon',
                    address: "12S3CcAtftrYJn1woQVUx94RdcTTRXoSyFM76wjyTesf6AvhMPw94u16TUJCdubsQMuu7J9L4pzukxY1DxqVFv91Y72b3LoDgRKKknJ",
                  },
                  {
                    name: 'pDEX',
                    address: "12S1JXdHZFTGon2C1sZCE59noGRA6rL6qoo9Rf6fberdni2ezwstj9HLCzPPqy3ojUkk8PGMADhyR7tWDewLZmKGW6vK7RF8ZjVAJyF",
                  },
                  {
                    name: 'pDEXWithdraw',
                    address: "12RuZPdB1jvroAnqwpZweSW4QJbTEi34x58TP8CnEpCjHV5wrHaTdPPRieYtBe7ZUn6F37nv7scPf4hNLJ3XbrsyywgMWiufEAedJmf",
                  }
                ]
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
      getAccountInfo: getAccountInfo,
      getAccounts: getAccounts
    }
  })
