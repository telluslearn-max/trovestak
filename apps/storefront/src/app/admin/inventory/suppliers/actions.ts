'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/admin/guard';
import { logAdminActivity } from '@/lib/admin/activity';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:8083';
const SERVICE_SECRET = process.env.ORDER_SERVICE_SECRET || '';

function serviceHeaders() {
    return { 'Content-Type': 'application/json', 'x-service-token': SERVICE_SECRET };
}

async function callCatalog(path: string, options: RequestInit = {}) {
    const res = await fetch(`${CATALOG_SERVICE_URL}${path}`, {
        ...options,
        headers: { ...serviceHeaders(), ...(options.headers as object || {}) },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function deleteSupplierAction(supplierId: string) {
    try {
        await ensureAdmin('manager');
        const result = await callCatalog(`/suppliers/${supplierId}`, { method: 'DELETE' });
        await logAdminActivity({ action: 'DELETE_SUPPLIER', resource: 'supplier', resourceId: supplierId, metadata: { method: 'admin_bypass_rls' } });
        revalidatePath('/admin/inventory/suppliers');
        return result;
    } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
    }
}

export async function purgeSuppliersAction() {
    try {
        await ensureAdmin('super_admin');
        const result = await callCatalog('/suppliers', { method: 'DELETE' });
        await logAdminActivity({ action: 'PURGE_SUPPLIER_DIRECTORY', resource: 'supplier', resourceId: 'all', metadata: { method: 'admin_bypass_rls' } });
        revalidatePath('/admin/inventory/suppliers');
        return result;
    } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
    }
}

export async function createSupplierAction(formData: Record<string, unknown>) {
    try {
        await ensureAdmin('editor');
        const result = await callCatalog('/suppliers', { method: 'POST', body: JSON.stringify(formData) });
        if (result.success) {
            await logAdminActivity({ action: 'CREATE_SUPPLIER', resource: 'supplier', resourceId: result.data?.id, metadata: { name: formData.name } });
        }
        revalidatePath('/admin/inventory/suppliers');
        return result;
    } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
    }
}
