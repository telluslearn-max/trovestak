import { Suspense } from "react";
import SearchPageContent from "./search-content";

function SearchLoading() {
    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">
                        Search<span className="text-muted-foreground/30">.</span>
                    </h1>
                </div>
                <div className="h-16 bg-muted/30 rounded-2xl animate-pulse"></div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchLoading />}>
            <SearchPageContent />
        </Suspense>
    );
}
