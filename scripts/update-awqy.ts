import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://hqydwwfulatawjpottlf.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Muda awqy de admin para passenger
  const { error } = await supabase
    .from("profiles")
    .update({ role: "passenger", account_type: "passenger" })
    .eq("email", "awqy@awqy.com")
  
  if (error) {
    console.error("Erro:", error)
  } else {
    console.log("awqy@awqy.com atualizado: admin → passenger")
  }

  // Verifica
  const { data } = await supabase
    .from("profiles")
    .select("email, role, account_type")
    .eq("email", "awqy@awqy.com")
    .single()

  console.log("Profile:", JSON.stringify(data, null, 2))
}
main().catch(console.error)
