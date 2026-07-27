import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://hqydwwfulatawjpottlf.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Clean test profiles
  console.log("=== CLEANING TEST DATA ===")
  
  const testProfileIds = ["4a04db3b-575e-4d98-b5ac-63fc1e6efa97"]
  const testUserIds = ["4a04db3b-575e-4d98-b5ac-63fc1e6efa97", "7953d0da-2050-4345-97e2-bc6bc74fe6d6"]

  for (const id of testProfileIds) {
    await supabase.from("driver_profiles").delete().eq("id", id)
    await supabase.from("profiles").delete().eq("id", id)
    console.log("Deleted profile:", id)
  }

  for (const id of testUserIds) {
    const { error } = await supabase.auth.admin.deleteUser(id)
    console.log("Deleted auth user:", id, error ? "ERROR: " + error.message : "OK")
  }

  // Check if awqy has a profile
  const { data: awqyProfile } = await supabase.from("profiles").select("id, email, role").eq("email", "awqy@awqy.com").maybeSingle()
  if (!awqyProfile) {
    // Create admin profile for awqy
    const { data: authUser } = await supabase.auth.admin.getUserById("cf239c40-66f4-4c1d-ab19-640945edb8c9")
    if (authUser?.user) {
      const { error: insertError } = await supabase.from("profiles").upsert({
        id: "cf239c40-66f4-4c1d-ab19-640945edb8c9",
        email: "awqy@awqy.com",
        full_name: "Admin",
        role: "admin",
        account_type: "passenger",
        country: "BR",
        language: "pt-BR",
        accepted_terms: true,
      })
      console.log("Created awqy profile:", insertError ? "ERROR: " + insertError.message : "OK")
    }
  } else {
    // Ensure it's admin
    const { error: updateError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", awqyProfile.id)
    console.log("Updated awqy to admin:", updateError ? "ERROR: " + updateError.message : "OK")
  }

  // Final check
  const { data: remainingProfiles } = await supabase.from("profiles").select("id, email, role").limit(20)
  console.log("\n=== REMAINING PROFILES ===")
  console.log(JSON.stringify(remainingProfiles, null, 2))

  const { data: authUsers } = await supabase.auth.admin.listUsers()
  console.log("\n=== REMAINING AUTH USERS ===")
  console.log(JSON.stringify(authUsers?.users.map(u => ({id: u.id, email: u.email})), null, 2))
}
main().catch(console.error)
