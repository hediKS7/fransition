import { isAdminAuthConfigured, requireAdmin } from "@/lib/admin";
import AdminDashboard from "./admin-dashboard";
import AdminLogin from "./admin-login";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!await requireAdmin()) return <AdminLogin configured={isAdminAuthConfigured()} />;
  return <AdminDashboard adminName="Équipe Fransition" />;
}
