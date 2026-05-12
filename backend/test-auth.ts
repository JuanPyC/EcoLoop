import { createLocalClient } from "../../frontend/lib/supabase/local-client";

const options = {
  session: null as any,
  getSession: () => options.session,
  setSession: (s: any) => { options.session = s; },
  baseUrl: "http://localhost:3001"
};

const supabase = createLocalClient(options);

async function test() {
  console.log("1. Login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "admin@ecoloop.com",
    password: "admin123"
  });
  console.log("Login result:", error ? "ERROR: " + error.message : "SUCCESS");

  if (!error) {
    console.log("2. Get User...");
    const { data: { user } } = await supabase.auth.getUser();
    console.log("User ID:", user?.id);

    console.log("3. Get Profile...");
    const { data: profile, error: profError } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
    console.log("Profile result:", profError ? "ERROR: " + profError.message : "SUCCESS, role: " + profile?.role);
  }
}

test();
