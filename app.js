'use strict';

/**
 * Entry point for AiryBox. Initiates database connection and starts listening for requests on configured port.
 */

var config = require('./server/config/config'),
    mongo = require('./server/config/mongo'),
    mongoSeed = require('./server/config/mongo-seed'),
    koaConfig = require('./server/config/koa'),
    ws = require('./server/config/ws'),
    cache = require('./server/util/cache'),
    co = require('co'),
    koa = require('koa'),
    app = koa();

module.exports = app;

app.init = co(function *() {
  // initialize mongodb and populate the database with seed data if empty
  yield mongo.connect();
  yield mongoSeed();

  yield cache.init();

  // koa config
  koaConfig(app);

  // create http and websocket servers and start listening for requests
  app.server = app.listen(config.app.port);
  ws.listen(app.server);
  if (config.app.env !== 'test') {
    console.log('AiryBox listening on port ' + config.app.port);
  }
});

// auto init if this app is not being initialized by another module (i.e. using require('./app').init();)
if (!module.parent) {
  app.init();
}