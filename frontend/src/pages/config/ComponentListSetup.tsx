import { useState, useEffect } from "react";
import { ComponentForm } from "@/components/config/ComponentForm";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ComponentItem {
  id: string;
  name: string;
  manufacturer: string;
  part_number: string;
  cmm_number?: string;
  [key: string]: any;
}

const ComponentListSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [data, setData] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await api.components.list();
      if (Array.isArray(result)) {
        setData(result);
      } else if (result.data && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCreating) {
      fetchData();
    }
  }, [isCreating]);

  const filteredData = data.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (isCreating) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">Add New Component</h2>
            <p className="text-muted-foreground">
              Add new components to the catalog.
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsCreating(false)}>
            Back to List
          </Button>
        </div>
        <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
          <ComponentForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight uppercase text-gray-800">COMPONENT LIST SETUP</h2>
        <div className="text-sm text-muted-foreground">Configuration / Component List Setup</div>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]"><input type="checkbox" className="translate-y-[2px]" /></TableHead>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Component Name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>CMM Number</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell><input type="checkbox" className="translate-y-[2px]" /></TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium bg-secondary/20 rounded-sm px-2 py-1 inline-block mt-2 mb-2">{item.name}</TableCell>
                    <TableCell>{item.manufacturer}</TableCell>
                    <TableCell>{item.part_number}</TableCell>
                    <TableCell>{item.cmm_number || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ComponentListSetup;
