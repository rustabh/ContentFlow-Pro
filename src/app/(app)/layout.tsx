import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { SearchProvider } from "@/components/layout/SearchProvider";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SearchProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
          <footer className="no-print px-6 pb-6 text-center text-xs text-gray-400">
            Designed by <span className="font-medium text-primary-500">Incinc Media</span>
          </footer>
        </div>
      </div>
    </SearchProvider>
  );
}
