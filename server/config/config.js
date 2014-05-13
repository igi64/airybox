'use strict';

/**
 * Environment variables and application configuration.
 */

var path = require('path'),
    _ = require('lodash');

var baseConfig = {
  app: {
    root: path.normalize(__dirname + '/../..'),
    env: process.env.NODE_ENV,
    secret: process.env.SECRET /* used in signing the jwt tokens */,
    pass: process.env.PASS /* generic password for seed data */
  },
  oauth: {
    google: {
      clientSecret: process.env.GOOGLE_SECRET
    }
  }
};

var platformConfig = {
  development: {
    app: {
      port: 3000,
      secret: 'secret key',
      pass: 'pass'
    },
    mongo: {
      url: 'mongodb://localhost:27017/airybox-dev'
    },
    oauth: {
      google: {
        clientId: '19578800379.apps.googleusercontent.com',
        callbackUrl: 'http://localhost:3000/signin/google/callback'
      }
    }
  },

  test: {
    app: {
      port: 3001,
      secret: 'secret key',
      pass: 'pass'
    },
    mongo: {
      url: 'mongodb://localhost:27017/airybox-test'
    }
  },

  production: {
    app: {
      port: process.env.PORT || 3000,
      cacheTime: 7 * 24 * 60 * 60 * 1000 /* default caching time (7 days) for static files, calculated in milliseconds */
    },
    mongo: {
      url: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/airybox'
    },
    oauth: {
      google: {
        clientId: '19578800379.apps.googleusercontent.com',
        callbackUrl: 'https://airybox.org/signin/google/callback'
      }
    }
  }
};

// override the base configuration with the platform specific values
module.exports = _.merge(baseConfig, platformConfig[baseConfig.app.env || (baseConfig.app.env = 'development')]);
