'use strict';

angular
    .module('airybox.messages', [
      'ngRoute',
      'airybox.common'
    ])
    .config(function ($routeProvider) {
      $routeProvider
          .when('/messages', {
            title: 'Messages',
            templateUrl: 'modules/messages/messages.html',
            controller: 'MessagesCtrl'
          });
    });