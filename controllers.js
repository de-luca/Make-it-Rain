'use strict';

const Datastore = require('nedb');
let db = new Datastore({
  filename: __dirname+'/../db/mir',
  autoload: true
});

db.findOne({_obj: 'post_list'}, (err, posts) => {
  if(!posts)
    db.insert({_obj: "post_list", list: []});
});
db.findOne({_obj: 'company_list'}, (err, comps) => {
  if(!comps)
    db.insert({_obj: "company_list", list: []});
});

angular.module('mirCtrls', [])

.controller('overviewCtrl', function($scope, $q, $uibModal) {
  let getData = () => {
    return $q((resolve, reject) => {
      db.find({_obj: "account"}, (error, docs) => {
        resolve(docs);
      });
    });
  };

  getData().then((docs) => {
    $scope.accounts = docs;
  });

  $scope.insert = () => {
    let acc = {
      _id: undefined,
      _obj: 'account',
      name: $scope.newAccount.name,
      init: parseFloat($scope.newAccount.init),
      balance: parseFloat($scope.newAccount.init),
      thresholds: {
        critical: 0,
        warning: 500,
        ok: 1000
      },
      moves: []
    };
    db.insert(acc, (err, inserted) => {
      $scope.new = false;
      $scope.newAccount = undefined;
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
      db.update({_id: id}, {$set: {name: obj.newName}}, {}, (err, numReplaced) => {
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
      db.remove({_id: id}, {multi: true} ,(err) => {
        getData().then((docs) => {
          $scope.accounts = docs;
        }, (err) => {
          throw err;
        });
      });
    });
  };
})

.controller('accountCtrl', function($scope, $q, $routeParams, $uibModal) {
  $scope.predicate = 'date';
  $scope.reverse = true;
  $scope.show = 'history';
  $scope.results = [];
  $scope.newMove = {
    date: new Date()
  };

  $scope.refine = {
    post: [],
    company: []
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
  $scope.avg = (items) => {
    let avg = 0;
    items.forEach((item) => {
      avg += item.amount;
    });
    return Math.round((avg/items.length) *100)/100;
  };
  $scope.min = (items) => {
    let min;
    items.forEach((item) => {
      min = (!min || min > item.amount) ? item.amount : min;
    });
    return min;
  };
  $scope.max = (items) => {
    let max;
    items.forEach((item) => {
      max = (!max || max < item.amount) ? item.amount : max;
    });
    return max;
  };

  let getData = () => {
    return $q((resolve, reject) => {
      let data = {};
      let proceed = _.after(3, () => {
        resolve(data);
      });

      db.findOne({_id: $routeParams.id}, (err, acc) => {
        data.acc = acc;
        proceed();
      });
      db.findOne({_obj: 'post_list'}, (err, posts) => {
        data.posts = posts.list;
        proceed();
      });
      db.findOne({_obj: 'company_list'}, (err, comps) => {
        data.comps = comps.list;
        proceed();
      });
    });
  };

  getData().then((data) => {
    $scope.data = data;
  }, (err) => {
    throw err;
  });

  $scope.order = (predicate) => {
    $scope.predicate = predicate;
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : true;
  };

  $scope.insert = () => {
    $scope.newMove.amount = parseFloat($scope.newMove.amount);
    let proceed = _.after(3, () => {
      getData().then((data) => {
        $scope.data = data;
        $scope.newMove = {
          date: new Date()
        };
      });
    });

    db.update({_id: $routeParams.id}, {$push: {moves: $scope.newMove}, $inc: {balance: $scope.newMove.amount}}, {}, () => {
      proceed();
    });

    if($scope.newMove.post) {
      db.update({_obj: 'post_list'}, {$addToSet: {list: $scope.newMove.post}}, {}, () => {
        proceed();
      });
    } else {
      proceed();
    }

    if($scope.newMove.post) {
      db.update({_obj: 'company_list'}, {$addToSet: {list: $scope.newMove.company}}, {}, () => {
        proceed();
      });
    } else {
      proceed();
    }
  };

  /* WIP */
  $scope.remove = (id) => {
    console.log(id);
  };

  $scope.updateTS = (valid) => {
    if(valid) {
      db.update({_id: $routeParams.id}, {$set: {thresholds: $scope.data.acc.thresholds}});
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
  $scope.currentLocale = $translate.use();
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
