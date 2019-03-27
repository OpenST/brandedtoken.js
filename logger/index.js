'use strict';

const { createLogger, format, transports } = require('winston');

const { combine, prettyPrint } = format;

const logPath = process.env.BRANDED_TOKEN_JS_LOGGER_PATH || 'log';
const logLevel = process.env.LOG_LEVEL || 'info';
const enableFileLogger = process.env.ENABLE_BRANDED_TOKEN_JS_LOGGER;

let defaultTransport = [
  new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple(),
    ),
    level: logLevel,
  }),
];

if (enableFileLogger && enableFileLogger === 'true') {
  defaultTransport = [
    new transports.File(
      {
        filename: `${logPath}/brandedTokenJS.log`,
        level: logLevel,
      },
    ),
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
