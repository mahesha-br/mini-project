import { Loader2 } from "lucide-react";

export function PageSpinner({ label = "Loading..." }) {
    return (
        <div className="flex items-center justify-center min-h-[200px] flex-col gap-3" role="status" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="text-muted-foreground text-sm">{label}</p>
        </div>
    );
}
