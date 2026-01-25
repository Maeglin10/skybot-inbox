import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Extend with model delegates for TypeScript
interface ModelDelegate {
  findFirst(args?: any): Promise<any>;
  findUnique(args?: any): Promise<any>;
  findMany(args?: any): Promise<any[]>;
  create(args?: any): Promise<any>;
  createMany(args?: any): Promise<any>;
  update(args?: any): Promise<any>;
  updateMany(args?: any): Promise<any>;
  delete(args?: any): Promise<any>;
  deleteMany(args?: any): Promise<any>;
  upsert(args?: any): Promise<any>;
  count(args?: any): Promise<number>;
}

// PrismaClient base class - use any to avoid type conflicts
const BasePrismaClient = require('@prisma/client').PrismaClient;

@Injectable()
export class PrismaService
  extends BasePrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  // Model delegates - typed for flexibility without full Prisma generate
  declare account: ModelDelegate;
  declare clientConfig: ModelDelegate;
  declare inbox: ModelDelegate;
  declare contact: ModelDelegate;
  declare conversation: ModelDelegate;
  declare message: ModelDelegate;
  declare routingLog: ModelDelegate;
  declare externalAccount: ModelDelegate;
  declare userAccount: ModelDelegate;
  declare userPreference: ModelDelegate;
  declare lead: ModelDelegate;
  declare feedback: ModelDelegate;
  declare alert: ModelDelegate;

  // Prisma methods
  declare $connect: () => Promise<void>;
  declare $disconnect: () => Promise<void>;
  declare $transaction: <T>(fn: (prisma: any) => Promise<T>) => Promise<T>;

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is missing');

    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);

    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
