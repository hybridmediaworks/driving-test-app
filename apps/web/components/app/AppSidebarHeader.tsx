import { SidebarTrigger } from "@/components/ui/sidebar";
import Breadcrumbs from "./Breadcrumbs";

type BreadcrumbItem = { title: string; href: string };

export default function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
  return (
    <header className="flex h-14 min-h-14 shrink-0 items-center gap-2 border-b border-sidebar-border/70 px-3 transition-[width,height] ease-linear sm:h-16 sm:min-h-16 sm:px-4 md:px-6">
      <SidebarTrigger className="-ml-0.5 shrink-0 sm:-ml-1" />
      {breadcrumbs.length > 0 && (
        <div className="min-w-0 flex-1 overflow-x-auto">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
      )}
    </header>
  );
}
