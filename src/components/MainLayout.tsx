
'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DesktopSidebar } from "./DesktopSidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const isMobile = useIsMobile();
    return (
        <div className="flex w-full">
            <DesktopSidebar />
            <div className={cn("flex flex-1 min-h-dvh flex-col pb-24 md:pb-6", !isMobile && "md:ml-16")}>
                {children}
            </div>
        </div>
    )
}
