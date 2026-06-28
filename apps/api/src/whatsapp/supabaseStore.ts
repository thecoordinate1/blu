import { supabase } from '../supabase/client.js';
import * as fs from 'fs';

export class SupabaseAuthStore {
  private bucketName = 'Clientmeadia';

  async sessionExists(options: { session: string }): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list('sessions', { search: `${options.session}.zip` });

      if (error) {
        console.error(`[SupabaseAuthStore] Error listing sessions: ${error.message}`);
        return false;
      }
      return data && data.length > 0;
    } catch (err: any) {
      console.error(`[SupabaseAuthStore] Unexpected error checking session: ${err.message}`);
      return false;
    }
  }

  async save(options: { session: string; path: string }): Promise<void> {
    try {
      const fileBuffer = await fs.promises.readFile(options.path);
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(`sessions/${options.session}.zip`, fileBuffer, {
          upsert: true,
          contentType: 'application/zip'
        });

      if (error) {
        console.error(`[SupabaseAuthStore] Failed to upload session zip: ${error.message}`);
        throw error;
      }
      console.log(`[SupabaseAuthStore] Successfully persisted session zip for ${options.session}`);
    } catch (err: any) {
      console.error(`[SupabaseAuthStore] Save failed for session ${options.session}:`, err.message);
      throw err;
    }
  }

  async extract(options: { session: string; path: string }): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(`sessions/${options.session}.zip`);

      if (error || !data) {
        console.error(`[SupabaseAuthStore] Failed to download session zip: ${error?.message || 'No data'}`);
        throw error || new Error('Session zip download failed');
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      await fs.promises.writeFile(options.path, buffer);
      console.log(`[SupabaseAuthStore] Successfully extracted session zip for ${options.session}`);
    } catch (err: any) {
      console.error(`[SupabaseAuthStore] Extract failed for session ${options.session}:`, err.message);
      throw err;
    }
  }

  async delete(options: { session: string }): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([`sessions/${options.session}.zip`]);

      if (error) {
        console.error(`[SupabaseAuthStore] Failed to delete session zip: ${error.message}`);
        throw error;
      }
      console.log(`[SupabaseAuthStore] Successfully deleted remote session zip for ${options.session}`);
    } catch (err: any) {
      console.error(`[SupabaseAuthStore] Delete failed for session ${options.session}:`, err.message);
      throw err;
    }
  }
}
