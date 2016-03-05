'use strict';

const Datastore = require('nedb');
let db = new Datastore({
  filename: __dirname+'/../db/mir',
  autoload: true
});

angular.module('mirCtrls', []).

controller('overviewCtrl', ['$scope', '$q', '$uibModal', ($scope, $q, $uibModal) => {
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
}]).

controller('accountCtrl', ['$scope', '$q', '$routeParams', '$uibModal', ($scope, $q, $routeParams, $uibModal) => {
  $scope.predicate = 'date';
  $scope.reverse = true;
  $scope.show = 'history';
  $scope.newMove = {
    date: new Date()
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
    //$scope.newMove._id = Math.random().toString(36).substring(7);
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

}]).

controller('editModalCtrl', ($scope, $uibModalInstance) => {
  $scope.ok = () => {
    $uibModalInstance.close($scope.obj);
  };
  $scope.cancel = () => {
    $uibModalInstance.dismiss();
  };
}).

controller('deleteModalCtrl', ($scope, $uibModalInstance) => {
  $scope.ok = () => {
    $uibModalInstance.close();
  };
  $scope.cancel = () => {
    $uibModalInstance.dismiss();
  };
}).

controller('localeCtrl', ['$scope', '$translate', ($scope, $translate) => {
  $scope.currentLocale = $translate.use();
  $scope.selectLocale = (locale) => {
    $translate.use(locale);
    $scope.currentLocale = locale;
  };
}]);
