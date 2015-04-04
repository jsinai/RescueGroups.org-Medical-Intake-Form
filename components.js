/**
 *
 * Created by jsinai on 3/28/15.
 */
'use strict';

catsApp.directive('fileInput', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            elem.bind('change', function () {
                $parse(attrs.fileInput).assign(scope, elem[0].files);
                scope.$apply();
            })
        }
    }
});

/*
 How to use:
 <button ng-disabled="isUploading" class="btn btn-primary" ng-click="upload()" js-spinner="isUploading">Upload</button>
 Where isUploading is the name of the scope variable we want to watch.
 */
catsApp.directive('jsSpinner', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch(function () {
                return scope[attrs.jsSpinner];
            }, function (newValue, oldValue) {
                if (newValue === true) {
                    element.append("<span>&nbsp;&nbsp;<i class='fa fa-cog fa-spin fa-lg'></i></span>");
                }
            });

        }
    }
});
