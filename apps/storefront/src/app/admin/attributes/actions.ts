"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { logAdminActivity } from "@/lib/admin/activity";

// ─── Attributes CRUD ─────────────────────────────────────────

export async function getAttributes() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("attributes")
        .select("*, attribute_values(id, value, hex_color, sort_order)")
        .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createAttribute(formData: {
    name: string;
    slug: string;
    display_type: string;
    filterable: boolean;
}) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("attributes")
        .insert({
            name: formData.name,
            slug: formData.slug,
            display_type: formData.display_type,
            filterable: formData.filterable,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "CREATE_ATTRIBUTE",
        resource: "attributes",
        resourceId: data.id,
        metadata: { name: formData.name },
    });

    revalidatePath("/admin/attributes");
    return data;
}

export async function updateAttribute(
    id: string,
    updates: { name?: string; slug?: string; display_type?: string; filterable?: boolean }
) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("attributes")
        .update(updates)
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "UPDATE_ATTRIBUTE",
        resource: "attributes",
        resourceId: id,
        metadata: updates,
    });

    revalidatePath("/admin/attributes");
}

export async function deleteAttribute(id: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("attributes")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "DELETE_ATTRIBUTE",
        resource: "attributes",
        resourceId: id,
    });

    revalidatePath("/admin/attributes");
}

// ─── Attribute Values CRUD ─────────────────────────────────────

export async function createAttributeValue(data: {
    attribute_id: string;
    value: string;
    hex_color?: string;
    sort_order?: number;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
        .from("attribute_values")
        .insert(data)
        .select()
        .single();

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "CREATE_ATTRIBUTE_VALUE",
        resource: "attribute_values",
        resourceId: inserted.id,
        metadata: data,
    });

    revalidatePath("/admin/attributes");
    return inserted;
}

export async function updateAttributeValue(
    id: string,
    updates: { value?: string; hex_color?: string; sort_order?: number }
) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("attribute_values")
        .update(updates)
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/attributes");
}

export async function deleteAttributeValue(id: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("attribute_values")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/attributes");
}

// ─── Templates CRUD ─────────────────────────────────────────

export async function getTemplates() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("variant_templates")
        .select("*, variant_template_attributes(attribute_id, attributes:attributes(id, name, slug))")
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createTemplate(formData: { name: string; slug: string; attribute_ids: string[] }) {
    const supabase = await createSupabaseServerClient();

    const { data: tmpl, error } = await supabase
        .from("variant_templates")
        .insert({ name: formData.name, slug: formData.slug })
        .select()
        .single();

    if (error) throw new Error(error.message);

    if (formData.attribute_ids.length > 0) {
        const rows = formData.attribute_ids.map((aid) => ({
            template_id: tmpl.id,
            attribute_id: aid,
        }));
        const { error: linkErr } = await supabase
            .from("variant_template_attributes")
            .insert(rows);
        if (linkErr) throw new Error(linkErr.message);
    }

    await logAdminActivity({
        action: "CREATE_TEMPLATE",
        resource: "variant_templates",
        resourceId: tmpl.id,
        metadata: { name: formData.name },
    });

    revalidatePath("/admin/attributes");
    return tmpl;
}

export async function updateTemplateAttributes(templateId: string, attribute_ids: string[]) {
    const supabase = await createSupabaseServerClient();

    // Clear existing
    await supabase
        .from("variant_template_attributes")
        .delete()
        .eq("template_id", templateId);

    // Insert new
    if (attribute_ids.length > 0) {
        const rows = attribute_ids.map((aid) => ({
            template_id: templateId,
            attribute_id: aid,
        }));
        const { error } = await supabase
            .from("variant_template_attributes")
            .insert(rows);
        if (error) throw new Error(error.message);
    }

    revalidatePath("/admin/attributes");
}

export async function deleteTemplate(id: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("variant_templates")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "DELETE_TEMPLATE",
        resource: "variant_templates",
        resourceId: id,
    });

    revalidatePath("/admin/attributes");
}
