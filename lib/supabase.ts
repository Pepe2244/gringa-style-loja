
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lijsjlkgydlszdhmsppt.supabase.co'
const supabaseKey = 'sb_publishable_euV1pDAaO_nv3b3i6Sls-w_cfoAYbbh'

export const supabase = createClient(supabaseUrl, supabaseKey)
