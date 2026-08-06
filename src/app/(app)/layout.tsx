import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { SearchProvider } from "@/components/layout/SearchProvider";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const user = await getSessionUser(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");

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
