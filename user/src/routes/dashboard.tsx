import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ConsumerDashboard } from "./consumer";
import { CollectorDashboard } from "./collector";
import { RecyclerDashboard } from "./recycler";
import { ManufacturerDashboard } from "./manufacturer";
import { useRoleSession } from "@/lib/roleSession";
import { queueRolePickerOpen } from "@/lib/rolePicker";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · EcoToken" }] }),
  component: DashboardRoute,
});

function DashboardRoute() {
  const { activeRole } = useRoleSession();
  if (!activeRole) {
    queueRolePickerOpen();
    return <Navigate to="/" />;
  }

  if (activeRole === "consumer") return <ConsumerDashboard />;
  if (activeRole === "collector") return <CollectorDashboard />;
  if (activeRole === "recycler") return <RecyclerDashboard />;
  if (activeRole === "manufacturer") return <ManufacturerDashboard />;
  return <Navigate to="/" />;
}
