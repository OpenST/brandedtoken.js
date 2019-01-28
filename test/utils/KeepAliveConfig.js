class KeepAliveConfig {
  static get() {
    let maxHttpScokets = 10;
    let httpModule = require('http');
    httpModule.globalAgent.keepAlive = true;
    httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
    httpModule.globalAgent.maxSockets = maxHttpScokets;
  }
}

module.exports = KeepAliveConfig;
