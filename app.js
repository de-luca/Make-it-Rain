'use strict';

angular.module('mirApp', [
  'ngRoute',
  'mirCtrls',
  'ui.bootstrap',
  'chart.js',
  'pascalprecht.translate'
]).
factory('electronStorage', () => {
  return {
    put: function (name, value) {
      localStorage.setItem(name, value);
    },
    get: function (name) {
      localStorage.getItem(name);
    }
  };
}).
config(['$translateProvider', ($translateProvider) => {
  $translateProvider.
    useStaticFilesLoader({
      prefix: __dirname+'/../locales/locale-',
      suffix: '.json'
    });

  if(localStorage.getItem('NG_TRANSLATE_LANG_KEY')) {
    $translateProvider.preferredLanguage(localStorage.getItem('NG_TRANSLATE_LANG_KEY'));
  } else {
    $translateProvider.determinePreferredLanguage();
  }
  $translateProvider.fallbackLanguage('en_US').
    useSanitizeValueStrategy('escape').
    useStorage('electronStorage');
}]).
config(['$routeProvider', ($routeProvider) => {
  $routeProvider.
    when('/overview', {
      templateUrl: 'partials/overview.html',
      controller: 'overviewCtrl',
    }).
    when('/account/:id', {
      templateUrl: 'partials/account.html',
      controller: 'accountCtrl',
      contextTopBar: true
    }).
    otherwise({
      redirectTo: '/overview'
    });
}]);
