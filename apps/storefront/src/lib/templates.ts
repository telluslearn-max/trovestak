import templatesData from '@/templates/templates.json';
import type { DropdownGroup } from '@/components/ui/custom-dropdown';

export const templates = (templatesData as any);

export interface Template {
  id: string;
  name: string;
  file: string;
  category: string;
  badge?: string;
  description?: string;
  example_product?: string;
  use_case?: string;
  fields?: string[];
}

export interface Category {
  id: string;
  name: string;
  templates: Template[];
}

export function getTemplates(): Template[] {
  const flatTemplates: Template[] = [];
  (templatesData.categories as any).forEach((cat: any) => {
    cat.templates.forEach((t: any) => {
      flatTemplates.push({
        ...t,
        category: cat.id,
        description: t.description || "CSV template for " + cat.name,
        example_product: t.example_product || "N/A",
        use_case: t.use_case || "Standard product import",
        fields: t.fields || []
      });
    });
  });
  return flatTemplates;
}

export function getCategories(): { id: string; name: string; templates: string[] }[] {
  return (templatesData.categories as any).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    templates: cat.templates.map((t: any) => t.id),
  }));
}

export function getTemplatesForDropdown(): DropdownGroup[] {
  return (templatesData.categories as any).map((cat: any) => ({
    id: cat.id,
    label: cat.name,
    items: cat.templates.map((t: any) => ({
      id: t.id,
      label: t.name,
      badge: t.badge,
    })),
  }));
}

export function getTemplateById(id: string): Template | undefined {
  return getTemplates().find(t => t.id === id);
}

export function getTemplateFilePath(templateId: string): string {
  const template = getTemplateById(templateId);
  if (!template) return '';
  return `/templates/${template.file}`;
}
