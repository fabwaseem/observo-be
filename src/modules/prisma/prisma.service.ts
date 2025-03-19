import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Global,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';

@Global()
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pgClient: Client;

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.pgClient = new Client({
      connectionString: process.env.DATABASE_URL,
      // ssl: {
      //   rejectUnauthorized: false, // Adjust this based on your SSL configuration
      // },
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.pgClient.connect();
    await this.logConnections();
  }

  async onModuleDestroy() {
    await this.pgClient.end();
    await this.$disconnect();
  }

  async logConnections() {
    try {
      const res = await this.pgClient.query(
        'SELECT COUNT(*) FROM pg_stat_activity WHERE datname = $1',
        [this.pgClient.database],
      );
      console.log(`Number of connections: ${res.rows[0].count}`);
    } catch (error) {
      console.error('Error logging connections:', error);
    }
  }
}
