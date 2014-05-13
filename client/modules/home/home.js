'use strict';

/**
 * Home module for displaying home page content.
 */

angular
    .module('airybox.home', [
      'ngRoute',
      'monospaced.elastic',
      'airybox.common'
    ])
    .config(function ($routeProvider) {
      $routeProvider
          .when('/', {
            title: 'AiryBox',
            templateUrl: 'modules/home/home.html',
            controller: 'HomeCtrl'
          });
    });