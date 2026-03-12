"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Quote, Heading1, Heading2,
  Heading3, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  value?: string;
  onChange: (content: string) => void;
  onImageInsert?: () => void;
  placeholder?: string;
  className?: string;
}

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  children,
  className
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    className={cn(
      "h-8 w-8 p-0 rounded-lg transition-all",
      active ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/50",
      className
    )}
  >
    {children}
  </Button>
);

export function RichTextEditor({ content, value, onChange, onImageInsert, placeholder = "Start typing...", className }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-6",
          className
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    if (onImageInsert) {
      onImageInsert();
      return;
    }
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="w-full bg-card border border-border/50 rounded-[2rem] overflow-hidden focus-within:border-primary/30 transition-all shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-1 pr-2 border-r border-border/50 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-border/50 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-border/50 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-border/50 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-border/50 mr-1">
          <ToolbarButton onClick={setLink} active={editor.isActive('link')}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage}>
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Word Count / Info */}
      <div className="px-6 py-2 bg-muted/10 border-t border-border/30 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
        <div>Rich Text Editor Enabled</div>
        <div>{editor.storage.characterCount?.characters?.() || 0} Characters</div>
      </div>
    </div>
  );
}
