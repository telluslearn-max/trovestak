import { createSupabaseServerClient } from "@/lib/supabase-server";
import RolesPermissionsClient from "./roles-client";
import { Metadata } from "next";
import { T } from "@/components/admin/ui-pro";

export const metadata: Metadata = {
    title: "Roles & Permissions | Trovestak Admin",
    description: "Admin team access control and security scopes.",
};

const ROLES_STATIC = [
    { name: "Super Admin", users: 1, permissions: "Full Access", color: T.purple },
    { name: "Store Manager", users: 2, permissions: "Orders, Products, Customers", color: T.blue },
    { name: "Support Agent", users: 3, permissions: "Tickets, Customers (read)", color: T.green },
    { name: "Inventory Clerk", users: 1, permissions: "Inventory, Products (read)", color: T.cyan },
];

export default async function AdminRolesPermissionsPage() {
    // In a production environment, we would fetch roles and user counts from 'admin_roles' and 'admin_users' tables.
    // For now, we move the static definitions to the server to maintain consistency with our refactoring pattern.
    // const supabase = await createSupabaseServerClient();

    return (
        <RolesPermissionsClient roles={ROLES_STATIC} />
    );
}
