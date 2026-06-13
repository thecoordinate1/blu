import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  LENCO_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgqixjzznbrsdkmdvmrw.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncWl4anp6bmJyc2RrbWR2bXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDE4MzAsImV4cCI6MjA5Mjk3NzgzMH0.r5Q5mR-7GeEVEQMxTbE5TXhE1R-ese3VK5EmI2zzcoM',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncWl4anp6bmJyc2RrbWR2bXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMTgzMCwiZXhwIjoyMDkyOTc3ODMwfQ.irNvjJ0A290wm2dE63GqBVkAnwzaVPO-KaCmosHCyhY',
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
  LENCO_API_KEY: process.env.LENCO_API_KEY,
  REDIS_URL: process.env.REDIS_URL,
});
