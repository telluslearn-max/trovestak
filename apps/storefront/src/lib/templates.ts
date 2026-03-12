import templates from '@/templates/templates.json';
import type { DropdownGroup } from '@/components/ui/custom-dropdown';

interface Template {
  id: string;
  name: string;
  file: string;
  badge?: string;
}

interface Category {
  id: string;
  name: string;
  templates: Template[];
}

interface TemplateCategory {
  id: string;
  name: string;
  templates: Template[];
}

export function getTemplates(): TemplateCategory[] {
  return templates.categories as TemplateCategory[];
}

export function getCategories(): { id: string; name: string; templates: string[] }[] {
  return templates.categories.map((cat: Category) => ({
    id: cat.id,
    name: cat.name,
    templates: cat.templates.map((t: Template) => t.id),
  }));
}

export function getTemplatesForDropdown(): DropdownGroup[] {
  return templates.categories.map((cat: Category) => ({
    id: cat.id,
    label: cat.name,
    items: cat.templates.map((t: Template) => ({
      id: t.id,
      label: t.name,
      badge: t.badge,
    })),
  }));
}

export function getTemplateById(id: string): Template | undefined {
  for (const cat of templates.categories as Category[]) {
    const found = cat.templates.find((t: Template) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getTemplateFilePath(templateId: string): string {
  const template = getTemplateById(templateId);
  if (!template) return '';
  return `/templates/${template.file}`;
}
