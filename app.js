'use strict';

var catsApp = angular.module('catsApp', ['ui.router', 'ui.bootstrap', 'ipCookie', 'angular-growl']);

catsApp.config(function ($stateProvider) {
    $stateProvider.
        state('list', {
            url: "/",
            controller: listController,
            templateUrl: 'list.html',
            data: {
                authenticate: false
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
        state('findCat', {
            url: "/find-cat",
            controller: findCatController,
            templateUrl: 'find-cat.html',
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
        state('showCat', {
            url: "/bio/:catId",
            controller: bioController,
            templateUrl: 'bio.html',
            data: {
                authenticate: false
            },
            resolve: {
                catQueryResult: function (getOneCatToShow, $stateParams) {
                    var id = $stateParams.catId;
                    return getOneCatToShow.getData(id);
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
            controller: function($state, catState) {
               catState.logout();
                // Immediately redirect to the list page. So we don't ever display the logout page.
                $state.go("list");
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
                    (!catState.isLoggedIn())) {
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
