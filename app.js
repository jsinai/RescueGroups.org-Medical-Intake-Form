'use strict';

var catsApp = angular.module('catsApp', ['ui.router', 'ui.bootstrap', 'ipCookie', 'angular-growl']);

catsApp.config(function ($stateProvider) {
    $stateProvider.
        state('list', {
            url: "/",
            controller: listController,
            templateUrl: 'list.html',
            data: {
                authenticate: true
            }
        }).
        state('filteredList', {
            url: "/list/:status",
            controller: listController,
            templateUrl: 'list.html',
            data: {
                authenticate: true
            }
        }).
        state('addCat', {
            url: "/add",
            controller: medicalIntakeController,
            templateUrl: 'medical-intake-form.html',
            data: {
                authenticate: true
            }
        }).
        state('editCat', {
            url: "/edit/:catId",
            controller: editIntakeController,
            templateUrl: 'medical-intake-form.html',
            data: {
                authenticate: true
            },
            resolve: {
                catQueryResult: function (getOneCat, $stateParams, catState) {
                    var id = $stateParams.catId;
                    return getOneCat.getData(id, catState);
                }
            }
        }).
        state('login', {
            url: "/login",
            controller: loginController,
            templateUrl: 'login.html',
            data: {
                authenticate: false
            }
        }).
        state('logout', {
            url: "/logout",
            controller: function(catState) {
               catState.logout();
            },
            templateUrl: 'logout.html',
            data: {
                authenticate: false
            }
        });
})
    .run(function ($rootScope, $state, $stateParams, catState) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        // register listener to watch route changes
        $rootScope.$on("$stateChangeStart",
            function (event, toState, toParams, fromState, fromParams) {
                // TODO: replace with real role/privs like passport
                if (toState.data.authenticate &&
                    (!catState.getState().token || !catState.getState().tokenHash)) {
                    event.preventDefault();
                    $state.go("login");
                }
            });
    });
// TODO: doesn't work yet
catsApp.config(["growlProvider", "$httpProvider", function(growlProvider, $httpProvider) {
    growlProvider.messagesKey("ret.data.messages.recordMessages");
    growlProvider.messageTextKey("messageText");
//    growlProvider.messageSeverityKey("severity-level");
    $httpProvider.interceptors.push(growlProvider.serverMessagesInterceptor);
}]);
