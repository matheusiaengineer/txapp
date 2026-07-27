import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://hqydwwfulatawjpottlf.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: profiles } = await supabase.from("profiles").select("id, email, full_name, role, account_type").limit(50)
  console.log("=== PROFILES ===")
  console.log(JSON.stringify(profiles, null, 2))

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  console.log("=== AUTH USERS ===")
  if (authUsers) console.log(JSON.stringify(authUsers.users.map(u => ({id: u.id, email: u.email, created_at: u.created_at})), null, 2))
  if (authError) console.log("Auth error:", authError)
}
main().catch(console.error)
