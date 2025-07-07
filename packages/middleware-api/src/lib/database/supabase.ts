import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const environment = process.env.ENVIRONMENT || 'development';
const schemaPrefix = process.env.SCHEMA_PREFIX || 'dev_';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Service role client for admin operations
export const supabaseAdmin: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Table name helper function for dev schema
export function getTableName(tableName: Tables): string {
  return tableName; // Use table name without prefix (produtos, clientes, etc.)
}

// Get schema name based on environment
export function getSchemaName(): Schemas {
  return environment === 'production' ? Schemas.PUBLIC : Schemas.DEV; // dev schema in development
}

// Connection pool configuration
export const connectionConfig = {
  max: 20,
  min: 5,
  idle: 10000,
  acquire: 30000,
  evict: 5000,
};

// Database tables enum (for dev schema)
export enum Tables {
  PRODUTOS = 'produtos',
  CLIENTES = 'clientes',
  ESTOQUE = 'estoque',
  VENDAS = 'vendas',
  INTEGRATION_LOGS = 'integration_logs',
  USERS = 'users',
}

// Schema names
export enum Schemas {
  DEV = 'dev',
  PUBLIC = 'public',
}

// Database operations helper class
export class DatabaseService {
  private client: SupabaseClient<Database>;

  constructor(useServiceRole = false) {
    this.client = useServiceRole ? supabaseAdmin : supabase;
  }

  // Generic select operation
  async select<T>(
    table: Tables,
    query?: string,
    filters?: Record<string, any>
  ): Promise<T[]> {
    try {
      const schema = getSchemaName();
      const tableName = getTableName(table);
      let dbQuery = this.client.schema(schema).from(tableName).select(query || '*');

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            dbQuery = dbQuery.eq(key, value);
          }
        });
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw new Error(`Database select error: ${error.message}`);
      }

      return data as T[];
    } catch (error) {
      console.error('Database select operation failed:', error);
      throw error;
    }
  }

  // Generic insert operation
  async insert<T>(table: Tables, data: Partial<T>): Promise<T> {
    try {
      const schema = getSchemaName();
      const tableName = getTableName(table);
      const { data: insertedData, error } = await this.client
        .schema(schema)
        .from(tableName)
        .insert(data as any)
        .select()
        .single();

      if (error) {
        throw new Error(`Database insert error: ${error.message}`);
      }

      return insertedData as T;
    } catch (error) {
      console.error('Database insert operation failed:', error);
      throw error;
    }
  }

  // Generic update operation
  async update<T>(
    table: Tables,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    try {
      const schema = getSchemaName();
      const tableName = getTableName(table);
      const { data: updatedData, error } = await this.client
        .schema(schema)
        .from(tableName)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Database update error: ${error.message}`);
      }

      return updatedData as T;
    } catch (error) {
      console.error('Database update operation failed:', error);
      throw error;
    }
  }

  // Generic delete operation
  async delete(table: Tables, id: string): Promise<void> {
    try {
      const schema = getSchemaName();
      const tableName = getTableName(table);
      const { error } = await this.client
        .schema(schema)
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Database delete error: ${error.message}`);
      }
    } catch (error) {
      console.error('Database delete operation failed:', error);
      throw error;
    }
  }

  // Connection health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('pg_stat_activity')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Get table statistics
  async getTableStats(table: Tables): Promise<{ count: number }> {
    try {
      const schema = getSchemaName();
      const tableName = getTableName(table);
      const { count, error } = await this.client
        .schema(schema)
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Database count error: ${error.message}`);
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Database table stats failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
export const dbAdmin = new DatabaseService(true);

// Error handling utilities
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: any): never {
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        throw new DatabaseError('Record not found', 'NOT_FOUND');
      case 'PGRST202':
        throw new DatabaseError('Missing or invalid API key', 'UNAUTHORIZED');
      case '23505':
        throw new DatabaseError('Duplicate key value violates unique constraint', 'DUPLICATE');
      case '23503':
        throw new DatabaseError('Foreign key constraint violation', 'FOREIGN_KEY');
      default:
        throw new DatabaseError(error.message, error.code);
    }
  }
  throw new DatabaseError(error.message || 'Unknown database error');
}

// Export types
export type { Database } from './types';