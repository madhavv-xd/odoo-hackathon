import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { CopilotSheet } from "@/components/app/copilot-sheet";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} />
      <div className="md:pl-60">
        <Topbar user={user} />
        <main className="p-6">{children}</main>
      </div>
      <CopilotSheet />
    </div>
  );
}
