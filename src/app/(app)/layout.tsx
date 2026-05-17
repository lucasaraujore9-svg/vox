// Layout da área protegida. Sidebar colapsável + AppHeader (logout + offline) + palette ⌘⇧B.

import { AppHeader } from "@/components/shared/AppHeader";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { BiblePalette } from "@/components/bible/BiblePalette";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-full overflow-x-hidden min-w-0">
        <AppHeader />
        {children}
      </main>
      <BiblePalette />
    </div>
  );
}
