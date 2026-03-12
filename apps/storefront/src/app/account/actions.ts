"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
}

export async function updatePasswordAction(password: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}
