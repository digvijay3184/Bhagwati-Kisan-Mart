import * as Joi from 'joi';

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  MSG91_AUTH_KEY?: string;
  MSG91_OTP_TEMPLATE_ID?: string;
}

export const environmentValidationSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string().required().description('Supabase Postgres connection string'),
  REDIS_URL: Joi.string().optional().description('Upstash Redis connection URL'),
  JWT_SECRET: Joi.string().min(16).required().description('HMAC secret for access token'),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required().description('HMAC secret for refresh token'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  MSG91_AUTH_KEY: Joi.string().optional().allow('').description('MSG91 Authkey'),
  MSG91_OTP_TEMPLATE_ID: Joi.string().optional().allow('').description('MSG91 DLT template ID'),
});
