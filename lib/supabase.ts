
import { createClient } from '@supabase/supabase-js'
import { getStorageBucket } from '@/lib/site-config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_STORAGE_BUCKET = getStorageBucket()
const STORAGE_BUCKET_FALLBACKS = [
  DEFAULT_STORAGE_BUCKET,
  'gringa-style-produtos',
].filter((bucket, index, array) => bucket && array.indexOf(bucket) === index)

export async function uploadFileToSupabaseStorage(file: File, fileName: string, preferredBucket?: string) {
  const bucketsToTry = Array.from(
    new Set([preferredBucket, ...STORAGE_BUCKET_FALLBACKS].filter((bucket): bucket is string => Boolean(bucket)))
  )

  let lastError: any = null

  for (const bucket of bucketsToTry) {
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return { publicUrl: data.publicUrl, bucket, error: null }
    }

    lastError = error

    const message = error?.message?.toLowerCase() || ''
    if (!message.includes('bucket') || !message.includes('not found')) {
      break
    }
  }

  return { publicUrl: null, bucket: null, error: lastError }
}
