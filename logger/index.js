'use strict';

const { createLogger, format, transports } = require('winston');

const {
  combine, prettyPrint,
} = format;

const logPath = process.env.BRANDED_TOKEN_JS_LOGGER_PATH || 'log';
let defaultTransport = [new transports.Console({
  format: format.combine(
    format.colorize(),
    format.simple(),
  ),
})];

const enableLogger = process.env.ENABLE_BRANDED_TOKEN_JS_LOGGER;
if (enableLogger && enableLogger === true) {
  defaultTransport = [
    new transports.File({ filename: `${logPath}/error.log`, level: 'error' }),
    new transports.File({ filename: `${logPath}/combined.log` }),
  ];
}
const logger = createLogger({
  format: combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    prettyPrint(),

  ),
  defaultMeta: { service: 'brandedtoken.js' },
  transports: defaultTransport,
});

module.exports = logger;
