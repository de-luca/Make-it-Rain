'use strict';

const remote = require('remote');
const app = remote.require('app');
const crypto = require('crypto');
const Datastore = require('nedb');

let accountsDB = new Datastore({
  filename: app.getPath('userData')+'/db/accounts',
  autoload: true
});
let postsDB = new Datastore({
  filename: app.getPath('userData')+'/db/posts',
  autoload: true
});
let companiesDB = new Datastore({
  filename: app.getPath('userData')+'/db/companies',
  autoload: true
});

angular.module('mirCtrls', [])

.controller('overviewCtrl', function($scope, $q, $uibModal) {
  let getData = () => {
    return $q((resolve, reject) => {
      accountsDB.find({}, (error, docs) => {
        resolve(docs);
      });
    });
  };

  getData().then((docs) => {
    $scope.accounts = docs;
  });

  $scope.newAccount = {
    name: undefined,
    init: undefined
  };

  $scope.currencies = ['EUR', 'GBP', 'USD', 'CHF'];

  $scope.valid = () => {
    return (
      !$scope.newAccount.name ||
      !$scope.newAccount.init ||
      !$scope.newAccount.currency ||
      !(!isNaN(parseFloat($scope.newAccount.init)) && isFinite($scope.newAccount.init))
    );
  };

  $scope.insert = () => {
    let acc = {
      name: $scope.newAccount.name,
      init: parseFloat($scope.newAccount.init),
      balance: parseFloat($scope.newAccount.init),
      currency: $scope.newAccount.currency,
      created_on: new Date(),
      thresholds: {
        critical: 0,
        warning: 500,
        ok: 1000
      },
      moves: []
    };
    accountsDB.insert(acc, (err, inserted) => {
      $scope.new = false;
      $scope.newAccount = {
        name: undefined,
        init: undefined,
        currency: undefined
      };
      getData().then((docs) => {
        $scope.accounts = docs;
      }, (err) => {
        throw err;
      });
    });
  };

  $scope.edit = (id) => {
    event.preventDefault();
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'editModal.html',
      controller: 'editModalCtrl'
    });
    modalInstance.result.then((obj) => {
      accountsDB.update({_id: id}, {$set: {name: obj.newName}}, {}, (err, numReplaced) => {
        getData().then((docs) => {
          $scope.accounts = docs;
        }, (err) => {
          throw err;
        });
      });
    });
  };

  $scope.remove = (id) => {
    event.preventDefault();
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'deleteModal.html',
      controller: 'deleteModalCtrl'
    });
    modalInstance.result.then(() => {
      accountsDB.remove({_id: id}, {multi: true} ,(err) => {
        getData().then((docs) => {
          $scope.accounts = docs;
        }, (err) => {
          throw err;
        });
      });
    });
  };
})

.controller('accountCtrl', function($scope, $q, $routeParams) {
  $scope.show = 'history';

  $scope.getData = () => {
    return $q((resolve, reject) => {
      let data = {};
      let proceed = _.after(3, () => {
        resolve(data);
      });

      accountsDB.findOne({_id: $routeParams.id}, (err, acc) => {
        data.acc = acc;
        proceed();
      });
      postsDB.find({}, (err, posts) => {
        data.posts = posts;
        proceed();
      });
      companiesDB.find({}, (err, comps) => {
        data.comps = comps;
        proceed();
      });
    });
  };

  $scope.getData().then((data) => {
    $scope.account   = data.acc;
    $scope.posts     = data.posts;
    $scope.companies = data.comps;
  }, (err) => {
    console.warn(err);
    throw err;
  });
})

.controller('accountHistoryCtrl', function($scope, $uibModal) {
  $scope.predicate = 'date';
  $scope.reverse = true;

  $scope.order = (predicate) => {
    $scope.predicate = predicate;
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : true;
  };

  $scope.results = [];
  $scope.refiner = false;
  var oldRefine = $scope.refine = {
    post: [],
    company: []
  };

  $scope.toggleRefiner = () => {
    $scope.refiner = !$scope.refiner;
    if($scope.refiner)
      $scope.refine = oldRefine;
    else {
      oldRefine = $scope.refine;
      $scope.refine = {
        post: [],
        company: []
      };
    }
  };
  $scope.refinePost = (name) => {
    let index;
    if((index = $scope.refine.post.indexOf(name)) > -1)
      $scope.refine.post.splice(index, 1);
    else
      $scope.refine.post.push(name);
  };
  $scope.refineComp = (name) => {
    let index;
    if((index = $scope.refine.company.indexOf(name)) > -1)
      $scope.refine.company.splice(index, 1);
    else
      $scope.refine.company.push(name);
  };

  $scope.sum = (items) => {
    let sum = 0;
    items.forEach((item) => {
      sum += item.amount;
    });
    return sum;
  };
  $scope.avg = (items) => {
    return (items.length === 0) ? 0 : Math.round(($scope.sum(items)/items.length) *100)/100;
  };
  $scope.min = (items) => {
    let min = 0;
    items.forEach((item) => {
      min = (!min || min > item.amount) ? item.amount : min;
    });
    return min;
  };
  $scope.max = (items) => {
    let max = 0;
    items.forEach((item) => {
      max = (!max || max < item.amount) ? item.amount : max;
    });
    return max;
  };


  $scope.newMove = {
    date  : undefined,
    amount: undefined
  };

  $scope.valid = () => {
    return (
      !$scope.newMove.date ||
      !$scope.newMove.amount ||
      !(!isNaN(parseFloat($scope.newMove.amount)) && isFinite($scope.newMove.amount))
    );
  };
  $scope.insert = () => {
    $scope.newMove.amount = parseFloat($scope.newMove.amount);
    $scope.newMove._id = crypto.randomBytes(8).toString('hex');
    let proceed = _.after(3, () => {
      $scope.$parent.getData().then((data) => {
        $scope.$parent.account   = data.acc;
        $scope.$parent.posts     = data.posts;
        $scope.$parent.companies = data.comps;
        $scope.newMove = {
          date  : undefined,
          amount: undefined
        };
      }, (err) => {
        console.warn(err);
        throw err;
      });
    });

    accountsDB.update({_id: $scope.$parent.account._id}, {$push: {moves: $scope.newMove}, $inc: {balance: $scope.newMove.amount}}, {}, () => {
      proceed();
    });

    if($scope.newMove.post) {
      postsDB.insert({_id: $scope.newMove.post}, () => {
        proceed();
      });
    } else {
      proceed();
    }

    if($scope.newMove.post) {
      companiesDB.insert({_id: $scope.newMove.company}, () => {
        proceed();
      });
    } else {
      proceed();
    }
  };
  $scope.remove = (id) => {
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'deleteModal.html',
      controller: 'deleteModalCtrl'
    });
    modalInstance.result.then(() => {
      delete id.$$hashKey;
      accountsDB.update({_id: $scope.$parent.account._id}, {$inc: {balance: -id.amount}, $pull: {moves: id}}, {returnUpdatedDocs: true}, (err, num, up) => {
        $scope.$parent.account = up;
        $scope.$apply();
      });
    });
  };
})
.controller('accountConfigCtrl', function($scope) {
  $scope.updateTS = (valid) => {
    if(valid) {
      accountsDB.update({_id: $scope.$parent.account._id}, {$set: {thresholds: $scope.$parent.account.thresholds}});
    }
  };
})


.controller('editModalCtrl', function($scope, $uibModalInstance) {
  $scope.ok = () => {
    $uibModalInstance.close($scope.obj);
  };
  $scope.cancel = () => {
    $uibModalInstance.dismiss();
  };
})

.controller('deleteModalCtrl', function($scope, $uibModalInstance) {
  $scope.ok = () => {
    $uibModalInstance.close();
  };
  $scope.cancel = () => {
    $uibModalInstance.dismiss();
  };
})

.controller('topBarCtrl', function($scope, $route, $translate) {
  $scope.route = $route;
  $translate.onReady(() => {
    $scope.currentLocale = $translate.proposedLanguage();
  });
  $scope.selectLocale = (locale) => {
    $translate.use(locale);
    $scope.currentLocale = locale;
  };
})

.filter('refineFilter', function() {
  return function(items, refiner) {
    var filtered = [];
    angular.forEach(items, function(item) {
      if((refiner.post.length === 0 || refiner.post.indexOf(item.post) > -1) &&
         (refiner.company.length === 0 || refiner.company.indexOf(item.company) > -1) &&
         (!refiner.from || item.date >= refiner.from) &&
         (!refiner.to || item.date <= refiner.to)) {
        filtered.push(item);
      }
    });
    return filtered;
  };
});
