import { supabase } from '@/lib/supabase';

export interface CategoryNode {
    id: string;
    name: string;
    slug: string;
    children: CategoryNode[];
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .order('name');

    if (error || !categories) {
        console.error('Error fetching categories:', error);
        return [];
    }

    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Initialize map
    categories.forEach((c: { id: string; name: string; slug: string; parent_id: string | null }) => {
        map.set(c.id, { id: c.id, name: c.name, slug: c.slug, children: [] });
    });

    // Build tree
    categories.forEach((c: { id: string; name: string; slug: string; parent_id: string | null }) => {
        const node = map.get(c.id)!;
        if (c.parent_id) {
            const parent = map.get(c.parent_id);
            if (parent) {
                parent.children.push(node);
            }
        } else {
            roots.push(node);
        }
    });

    return roots;
}
