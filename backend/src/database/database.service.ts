import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('database.url');
    const isLocalhost = connectionString?.includes('localhost') || connectionString?.includes('127.0.0.1');

    this.pool = new Pool({
      connectionString,
      ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    this.pool.on('error', (err) => {
      this.logger.error(`Unexpected database pool error: ${err.message}`, err.stack);
    });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      this.logger.log('Database connection pool established successfully');
      client.release();
    } catch (error) {
      this.logger.error(
        `Failed to establish database connection at boot: ${(error as Error).message}`,
      );
      // In production/development, connection failure should be noted
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  async query<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 1000) {
        this.logger.warn(`Slow query executed in ${duration}ms: ${text.substring(0, 100)}...`);
      }
      return res;
    } catch (error: any) {
      if (error?.message?.includes('Connection terminated') || error?.message?.includes('connection timeout')) {
        this.logger.warn(`Retrying query after connection timeout: ${text.substring(0, 80)}...`);
        try {
          const res = await this.pool.query<T>(text, params);
          return res;
        } catch (retryError) {
          this.logger.error(
            `Query execution retry failed: ${(retryError as Error).message} for query: ${text.substring(0, 150)}...`,
          );
          throw retryError;
        }
      }
      this.logger.error(
        `Query execution error: ${(error as Error).message} for query: ${text.substring(0, 150)}...`,
      );
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async runMigrations(): Promise<void> {
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      this.logger.warn(`Migrations directory not found at ${migrationsDir}`);
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    // Ensure migrations tracking table exists
    await this.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const file of files) {
      const applied = await this.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [file],
      );

      if (applied.rows.length === 0) {
        this.logger.log(`Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        const client = await this.getClient();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (version) VALUES ($1)',
            [file],
          );
          await client.query('COMMIT');
          this.logger.log(`Migration applied successfully: ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          this.logger.error(
            `Migration failed for ${file}: ${(error as Error).message}`,
          );
          throw error;
        } finally {
          client.release();
        }
      }
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection pool');
    await this.pool.end();
  }
}
