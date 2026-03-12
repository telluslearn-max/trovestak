"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReviewFormProps {
    open: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    onSubmit: (review: {
        rating: number;
        title: string;
        body: string;
        pros: string[];
        cons: string[];
    }) => Promise<void>;
}

export function ReviewForm({ open, onClose, productId, productName, onSubmit }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [pros, setPros] = useState<string[]>([""]);
    const [cons, setCons] = useState<string[]>([""]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                rating,
                title,
                body,
                pros: pros.filter(p => p.trim()),
                cons: cons.filter(c => c.trim()),
            });

            // Reset form
            setRating(0);
            setTitle("");
            setBody("");
            setPros([""]);
            setCons([""]);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    const addPro = () => setPros([...pros, ""]);
    const addCon = () => setCons([...cons, ""]);
    const updatePro = (i: number, value: string) => {
        const updated = [...pros];
        updated[i] = value;
        setPros(updated);
    };
    const updateCon = (i: number, value: string) => {
        const updated = [...cons];
        updated[i] = value;
        setCons(updated);
    };
    const removePro = (i: number) => setPros(pros.filter((_, idx) => idx !== i));
    const removeCon = (i: number) => setCons(cons.filter((_, idx) => idx !== i));

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border/50 rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight">
                        Write a Review
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {productName}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Rating */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-3 block">
                            Your Rating *
                        </label>
                        <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setRating(i + 1)}
                                    onMouseEnter={() => setHoveredRating(i + 1)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "w-8 h-8 transition-colors",
                                            (hoveredRating || rating) > i
                                                ? "text-amber-400 fill-amber-400"
                                                : "text-muted-foreground/30"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {rating === 0 ? "Click to rate" : `${rating} star${rating > 1 ? "s" : ""}`}
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                            Review Title
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            maxLength={200}
                            className="h-12 bg-muted/20 border-border/50"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                            Your Review
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Share your experience with this product..."
                            rows={5}
                            className="w-full p-4 bg-muted/20 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/40 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>

                    {/* Pros */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-black uppercase tracking-widest text-emerald-500">
                                Pros
                            </label>
                            <button
                                type="button"
                                onClick={addPro}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                + Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {pros.map((pro, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        value={pro}
                                        onChange={(e) => updatePro(i, e.target.value)}
                                        placeholder="What did you like?"
                                        className="h-10 bg-emerald-500/5 border-emerald-500/20"
                                    />
                                    {pros.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removePro(i)}
                                            className="p-2 text-muted-foreground hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cons */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-black uppercase tracking-widest text-red-400">
                                Cons
                            </label>
                            <button
                                type="button"
                                onClick={addCon}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                + Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {cons.map((con, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        value={con}
                                        onChange={(e) => updateCon(i, e.target.value)}
                                        placeholder="What could be better?"
                                        className="h-10 bg-red-500/5 border-red-500/20"
                                    />
                                    {cons.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCon(i)}
                                            className="p-2 text-muted-foreground hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="flex-1 h-12 bg-primary hover:bg-primary/90"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Review"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
