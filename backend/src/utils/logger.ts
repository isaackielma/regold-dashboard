import winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isDev ? winston.format.prettyPrint() : winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});
