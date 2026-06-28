import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import { supabase } from '../supabase/client.js';

/**
 * Downloads a media attachment from an incoming WhatsApp message and uploads it to the Supabase Storage bucket 'Clientmeadia'.
 * Returns the public URL of the uploaded media file, or null on failure.
 */
export async function handleIncomingMedia(
  businessId: string,
  message: any
): Promise<string | null> {
  try {
    if (!message.hasMedia) return null;

    const media = await message.downloadMedia();
    if (!media) {
      console.warn(`[MediaHandler] Fired hasMedia but failed to download media for msg ${message.id.id}`);
      return null;
    }

    const buffer = Buffer.from(media.data, 'base64');
    // Extract a safe extension from mimetype (e.g. image/jpeg -> jpeg)
    const mimeParts = media.mimetype.split(';')[0].split('/');
    const extension = mimeParts[1] || 'bin';
    const filePath = `media/inbound/${businessId}/${message.id.id}.${extension}`;

    const { error } = await supabase.storage
      .from('Clientmeadia')
      .upload(filePath, buffer, {
        contentType: media.mimetype,
        upsert: true
      });

    if (error) {
      console.error(`[MediaHandler] Supabase Storage upload failed for ${filePath}:`, error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('Clientmeadia')
      .getPublicUrl(filePath);

    console.log(`[MediaHandler] Saved incoming media to ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error(`[MediaHandler] Unexpected error handling incoming media:`, err.message);
    return null;
  }
}

/**
 * Creates a whatsapp-web.js MessageMedia instance from a URL or base64 data.
 */
export async function createOutgoingMedia(
  source: { url?: string; base64?: string; mimetype?: string; filename?: string }
): Promise<any> {
  if (source.base64 && source.mimetype) {
    return new MessageMedia(
      source.mimetype,
      source.base64.replace(/^data:.*?;base64,/, ''), // Strip data URL prefix if present
      source.filename
    );
  }

  if (source.url) {
    try {
      const res = await fetch(source.url);
      if (!res.ok) {
        throw new Error(`Media fetch returned status ${res.status}`);
      }
      
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await res.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      return new MessageMedia(contentType, base64Data, source.filename);
    } catch (err: any) {
      console.error(`[MediaHandler] Failed to fetch media from URL ${source.url}:`, err.message);
      throw err;
    }
  }

  throw new Error('Invalid media source: must specify url or base64 & mimetype');
}
