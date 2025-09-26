export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'neha_dhruw_alerting_platform_secret_2025',
  dbPath: process.env.DB_PATH || './database.sqlite',
  nodeEnv: process.env.NODE_ENV || 'development',
  reminderInterval: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  defaultAuthor: 'Neha Dhruw'
};
