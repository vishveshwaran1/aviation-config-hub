import { AircraftTable } from "@/components/dashboard/AircraftTable";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-[#343a40]">DASHBOARD</h1>
          {/* <p className="text-muted-foreground">
            Overview of your fleet and recent activities.
          </p> */}
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Aircraft Fleet</h2>
          {/* <p className="text-sm text-muted-foreground">
            Manage and view your aircraft configuration and status.
          </p> */}
        </div>
        <AircraftTable />
      </div>
    </div>
  );
};

export default Dashboard;
