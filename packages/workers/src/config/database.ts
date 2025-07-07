import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service role key for elevated permissions
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public', // We'll use dev_ prefix in table names
  },
});

// Table names with dev_ prefix
export const Tables = {
  PRODUTOS: 'dev_produtos',
  CLIENTES: 'dev_clientes',
  ESTOQUE: 'dev_estoque',
  VENDAS: 'dev_vendas',
  INTEGRATION_LOGS: 'dev_integration_logs',
  USERS: 'dev_users',
} as const;

// Helper to get last successful sync timestamp
export const getLastSyncTimestamp = async (
  source: string,
  entityType: string
): Promise<Date | null> => {
  try {
    const { data, error } = await supabase
      .from(Tables.INTEGRATION_LOGS)
      .select('created_at')
      .eq('source', source)
      .eq('entity_type', entityType)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching last sync timestamp:', error);
      return null;
    }

    return data ? new Date(data.created_at) : null;
  } catch (error) {
    logger.error('Unexpected error in getLastSyncTimestamp:', error);
    return null;
  }
};

// Log integration activity
export const logIntegration = async (
  source: string,
  entityType: string,
  status: 'success' | 'error' | 'warning',
  details: any,
  error?: string
) => {
  try {
    const { error: insertError } = await supabase.from(Tables.INTEGRATION_LOGS).insert({
      source,
      entity_type: entityType,
      status,
      details,
      error_message: error,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      logger.error('Error logging integration:', insertError);
    }
  } catch (err) {
    logger.error('Unexpected error in logIntegration:', err);
  }
};

// Batch upsert helper
export const batchUpsert = async <T extends Record<string, any>>(
  table: string,
  data: T[],
  conflictColumns: string[] = ['id'],
  batchSize = 100
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    try {
      const { error } = await supabase
        .from(table)
        .upsert(batch, {
          onConflict: conflictColumns.join(','),
          ignoreDuplicates: false,
        });

      if (error) {
        logger.error(`Batch upsert error for ${table}:`, error);
        failed += batch.length;
      } else {
        success += batch.length;
      }
    } catch (err) {
      logger.error(`Unexpected error in batch upsert for ${table}:`, err);
      failed += batch.length;
    }
  }

  return { success, failed };
};

// Health check
export const isDatabaseHealthy = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(Tables.PRODUTOS)
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};