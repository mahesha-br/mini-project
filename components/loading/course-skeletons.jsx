import { Skeleton } from "@/components/ui/skeleton";

export function CourseCardSkeleton() {
    return (
        <div className="shadow rounded-xl border border-border overflow-hidden">
            <Skeleton className="w-full aspect-video rounded-none" />
            <div className="p-3 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-32 rounded-md" />
                </div>
            </div>
        </div>
    );
}

export function CourseCardGridSkeleton({ count = 3, className = "" }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <CourseCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function EditCoursePageSkeleton() {
    return (
        <div className="p-5 space-y-10 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row gap-6 p-5 border rounded-xl w-full">
                <div className="flex flex-col gap-3 flex-1">
                    <Skeleton className="h-9 w-2/3 max-w-md" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                        <Skeleton className="h-16 rounded-xl" />
                        <Skeleton className="h-16 rounded-xl" />
                        <Skeleton className="h-16 rounded-xl" />
                    </div>
                    <Skeleton className="h-10 w-40 rounded-md mt-2" />
                </div>
                <Skeleton className="w-full md:w-[380px] h-[260px] rounded-xl shrink-0" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-8 w-56 mx-auto md:mx-0" />
                <div className="flex flex-col items-center gap-4 mt-6">
                    <Skeleton className="h-24 w-[300px] rounded-xl" />
                    <Skeleton className="h-10 w-1" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-24 w-[300px] rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function CoursePlayerSkeleton() {
    return (
        <div className="flex gap-5 w-full">
            <div className="w-80 shrink-0 border-r p-5 space-y-3 hidden sm:block">
                <Skeleton className="h-7 w-40" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
            </div>
            <div className="flex-1 p-6 md:p-10 space-y-6">
                <div className="flex justify-between gap-4">
                    <Skeleton className="h-8 w-2/3 max-w-lg" />
                    <Skeleton className="h-10 w-40 rounded-md" />
                </div>
                <Skeleton className="h-6 w-36" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <Skeleton className="aspect-video w-full rounded-lg" />
                </div>
                <div className="space-y-4 mt-4">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export function EnrollCourseListSkeleton() {
    return (
        <div className="mt-3">
            <Skeleton className="h-7 w-72 mb-4" />
            <CourseCardGridSkeleton count={3} />
        </div>
    );
}
