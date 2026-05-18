import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen text-slate-100">
      <Sidebar />
      <div className="lg:pl-[17rem]">
        <Topbar />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px] flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
