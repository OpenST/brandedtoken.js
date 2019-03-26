'use strict';

const { createLogger, format, transports } = require('winston');

const {
  combine, timestamp, prettyPrint,
} = format;

const logPath = process.env.BRANDED_TOKEN_JS_LOGGER_PATH || 'log';
let defaultTransport = [];

if (process.env.ENABLE_BRANDED_TOKEN_JS_LOGGER) {
  defaultTransport = [
    new transports.File({ filename: `${logPath}/error.log`, level: 'error' }),
    new transports.File({ filename: `${logPath}/combined.log` }),
  ];
} else {
  defaultTransport.push(new transports.Console({
    format: format.simple(),
  }));
}
const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    prettyPrint(),
  ),
  defaultMeta: { service: 'JLP' },
  transports: defaultTransport,
});

module.exports = logger;
