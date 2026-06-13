import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryPanel from "./InventoryPanel";
import RequisitionSourcingPanel from "./RequisitionSourcingPanel";

const SupplyChain = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-[#343a40]">SUPPLY CHAIN</h1>
        </div>
      </div>

      <Tabs defaultValue="s1" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="s1" className="data-[state=active]:bg-white data-[state=active]:text-[#556ee6] data-[state=active]:shadow-sm">
            [ S1 ] Inventory & Stock Check
          </TabsTrigger>
          <TabsTrigger value="s2" className="data-[state=active]:bg-white data-[state=active]:text-[#556ee6] data-[state=active]:shadow-sm">
            [ S2 ] Requisition & Sourcing (PR)
          </TabsTrigger>
          <TabsTrigger value="s3" className="data-[state=active]:bg-white data-[state=active]:text-[#556ee6] data-[state=active]:shadow-sm">
            [ S3 ] Commercial Procurement (PO)
          </TabsTrigger>
          <TabsTrigger value="s4" className="data-[state=active]:bg-white data-[state=active]:text-[#556ee6] data-[state=active]:shadow-sm">
            [ S4 ] Logistics & Transit Tracking (AWB)
          </TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="s1" className="m-0">
            <InventoryPanel />
          </TabsContent>
          <TabsContent value="s2" className="m-0">
            <RequisitionSourcingPanel />
          </TabsContent>
          <TabsContent value="s3" className="m-0 p-6 bg-white border rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700">Commercial Procurement (PO)</h2>
            <p className="text-sm text-gray-500 mt-2">This section is currently under development.</p>
          </TabsContent>
          <TabsContent value="s4" className="m-0 p-6 bg-white border rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700">Logistics & Transit Tracking (AWB)</h2>
            <p className="text-sm text-gray-500 mt-2">This section is currently under development.</p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SupplyChain;
