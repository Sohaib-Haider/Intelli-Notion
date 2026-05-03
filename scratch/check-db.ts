import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('*')
  if (wsError) {
    console.error('Workspaces Error:', wsError)
  } else {
    console.log('Workspaces:', workspaces?.length || 0)
    workspaces?.forEach(w => console.log(`- ${w.name} (${w.id})`))
  }

  if (workspaces && workspaces.length > 0) {
    const { data: features, error: fError } = await supabase.from('workspace_features').select('*').eq('workspace_id', workspaces[0].id)
    if (fError) {
      console.error('Features Error:', fError)
    } else {
      console.log(`Features for ${workspaces[0].name}:`, features?.length || 0)
    }
  }
}

checkData()
