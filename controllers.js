'use strict';

const Datastore = require('nedb');
let db = new Datastore({
  filename: __dirname+'/../db/mir',
  autoload: true
});

angular.module('mirCtrls', []).

controller('overviewCtrl', ['$scope', '$q', '$rootScope', '$uibModal', ($scope, $q, $rootScope, $uibModal) => {
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
        $rootScope.$broadcast('notif', {
          type: 'success',
          msg: 'Le compte '+inserted.name+' a bien été enregistrée et initialisé a un solde de '+inserted.init+'€.'
        });
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
          $rootScope.$broadcast('notif', {
            type: 'success',
            msg: 'Le nouveau nom du compte a été sauvegarder.'
          });
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
          $rootScope.$broadcast('notif', {
            type: 'success',
            msg: 'Le compte et tout ses mouvements associés ont été supprimés.'
          });
        }, (err) => {
          throw err;
        });
      });
    });
  };
}]).

controller('accountCtrl', ['$scope', '$rootScope', '$q', '$routeParams', '$uibModal', function($scope, $rootScope, $q, $routeParams, $uibModal) {
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

  /* NOPE */
  $scope.remove = (id) => {
    console.log(id);

    /*
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'deleteModal.html',
      controller: 'deleteModalCtrl'
    });
    modalInstance.result.then(function() {
      db.remove({_id: id}, {}, function(err) {
        getData().then(function(data) {
          $scope.data = data;
          $rootScope.$broadcast('notif', {
            type: 'success',
            msg: 'Le mouvement a bien été supprimé.'
          });
        }, function(err) {
          throw err;
        });
      });
    });
    */
  };

}]).

controller('editModalCtrl', function ($scope, $uibModalInstance) {
  $scope.ok = function () {
    $uibModalInstance.close($scope.obj);
  };
  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
}).

controller('deleteModalCtrl', function ($scope, $uibModalInstance) {
  $scope.ok = function () {
    $uibModalInstance.close();
  };
  $scope.cancel = function () {
    $uibModalInstance.dismiss();
  };
}).

controller('notifCtrl', ['$scope', function($scope) {
  $scope.notifs = [];
  $scope.closeNotif = function(index) {
    $scope.notifs.splice(index, 1);
  };
  $scope.$on('notif', function(event, notif) {
    $scope.notifs.push(notif);
  });
}]).

controller('localeCtrl', ['$scope', '$translate', function($scope, $translate) {
  $scope.currentLocale = $translate.use();
  $scope.selectLocale = function(locale) {
    $translate.use(locale);
    $scope.currentLocale = locale;
  };
}]);
