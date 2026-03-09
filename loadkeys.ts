import { supabase } from "./supabase.js";

export async function getUserApiKeys(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("openrouter_api_key, gemini_api_key")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
