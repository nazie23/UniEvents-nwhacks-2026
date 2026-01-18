import { createBrowserClient } from "@supabase/ssr";

// create a single browser client instance and reuse it across the app to
// avoid recreating auth listeners / abort signals on every render.
const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function createClient() {
    return supabase;
}

export default supabase;
