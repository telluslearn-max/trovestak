import { Button } from "@/components/ui/button";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { SectionHead } from "./editor-layout";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/admin/theme-wrapper";

interface TabMediaProps {
    imagesForm: { thumbnail_url: string; gallery_urls: string[] };
    setImagesForm: (form: any) => void;
    onOpenLibrary: (type: "main" | "gallery") => void;
}

export function TabMedia({ imagesForm, setImagesForm, onOpenLibrary }: TabMediaProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const removeGalleryImage = (index: number) => {
        setImagesForm({
            ...imagesForm,
            gallery_urls: imagesForm.gallery_urls.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead title="Visual Assets" desc="Premium media for storefront showcases and technical details." />

            <div className="space-y-12 mt-6">
                {/* Main Image */}
                <div className="group">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3b82f6] mb-6 font-mono flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                        Hero Product Image
                    </h4>
                    <div
                        onClick={() => onOpenLibrary("main")}
                        className={cn(
                            "relative aspect-square w-full max-w-[360px] rounded-[3rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden shadow-sm group",
                            imagesForm.thumbnail_url
                                ? "border-[#e2e8f0] dark:border-[#1e293b] border-solid"
                                : "border-[#e2e8f0] dark:border-[#1e293b] hover:border-[#3b82f6] hover:bg-[#3b82f6]/5"
                        )}
                    >
                        {imagesForm.thumbnail_url ? (
                            <>
                                <img src={imagesForm.thumbnail_url} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        <ImageIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Update Coverage</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center bg-white/50 dark:bg-[#0f172a]/50">
                                <div className="w-16 h-16 rounded-[2rem] bg-[#f8fafc] dark:bg-[#1e293b] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6 text-[#3b82f6]" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-[#0f172a] dark:text-[#f8fafc]">Upload Hero Visual</p>
                                    <p className="text-[10px] text-[#64748b] dark:text-[#94a3b8] mt-2 font-medium">Recommended for high-dpi displays</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gallery */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3b82f6] font-mono flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                            Gallery Experience
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenLibrary("gallery")}
                            className="text-[10px] uppercase font-black tracking-widest h-9 px-5 rounded-xl bg-[#f1f5f9] dark:bg-[#1e293b] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Select Assets
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {imagesForm.gallery_urls.map((url, idx) => (
                            <div key={idx} className={cn(
                                "group relative aspect-square rounded-[1.5rem] overflow-hidden border shadow-sm transition-all hover:scale-[1.05] hover:-rotate-1",
                                isDark ? "bg-[#111827] border-[#1e293b]" : "bg-white border-slate-100"
                            )}>
                                <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <button
                                    onClick={() => removeGalleryImage(idx)}
                                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-xl translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <X className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={() => onOpenLibrary("gallery")}
                            className={cn(
                                "aspect-square rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group",
                                isDark
                                    ? "bg-[#0f172a] border-[#1e293b] hover:border-[#3b82f6] hover:bg-[#3b82f6]/5"
                                    : "bg-slate-50 border-slate-200 hover:border-[#3b82f6] hover:bg-white"
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-[#f8fafc] dark:bg-[#1e293b] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5 text-[#3b82f6]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#64748b] dark:text-[#94a3b8]">Add Assets</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
