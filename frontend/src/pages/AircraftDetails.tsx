
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const AircraftDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [aircraft, setAircraft] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAircraft = async () => {
            try {
                if (id) {
                    const data = await api.aircrafts.get(id);
                    setAircraft(data);
                }
            } catch (error) {
                console.error("Failed to fetch aircraft details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAircraft();
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center">Loading details...</div>;
    }

    if (!aircraft) {
        return <div className="p-8 text-center">Aircraft not found</div>;
    }

    // Helper to find component by section name
    const getComponent = (section: string) => {
        return aircraft.components?.find((c: any) => c.section === section) || {};
    };

    const apu = getComponent("APU");
    const mlgLeft = getComponent("Main Landing Gear Left");
    const mlgRight = getComponent("Main Landing Gear Right");
    const nlg = getComponent("Nose Landing Gear");

    const DetailSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="space-y-4 border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
            <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children}
            </div>
        </div>
    );

    const DetailItem = ({ label, value }: { label: string, value: string | number | null | undefined }) => (
        <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">{label}</Label>
            <Input readOnly value={value ?? "-"} className="bg-muted/50" />
        </div>
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#343a40]">AIRCRAFT DETAILS</h2>
                    <p className="text-muted-foreground">
                        View configuration for {aircraft.model} - {aircraft.registration_number}
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Aircraft Setup */}
                <DetailSection title="Section A: Aircraft Setup">
                    <DetailItem label="Aircraft Model" value={aircraft.model} />
                    <DetailItem label="Country" value={aircraft.country} />
                    <DetailItem label="MSN" value={aircraft.msn} />
                    <DetailItem label="National Registration ID" value={aircraft.registration_number} />
                    <DetailItem
                        label="Manufactured Date"
                        value={aircraft.manufacture_date ? format(new Date(aircraft.manufacture_date), "dd/MM/yyyy") : "-"}
                    />
                    <DetailItem
                        label="Date Received"
                        value={aircraft.delivery_date ? format(new Date(aircraft.delivery_date), "dd/MM/yyyy") : "-"}
                    />
                    <DetailItem label="Aircraft Hours" value={aircraft.flight_hours} />
                    <DetailItem label="Aircraft Cycles" value={aircraft.flight_cycles} />
                    <DetailItem label="No. of Engines" value={aircraft.engines_count} />
                    <DetailItem label="Status" value={aircraft.status} />
                </DetailSection>

                {/* APU Details */}
                <DetailSection title="Section B: APU Details">
                    <DetailItem label="APU Manufacturer" value={apu.manufacturer} />
                    <DetailItem label="APU Model" value={apu.model} />
                    <DetailItem label="APU Serial No" value={apu.serial_number} />
                    <DetailItem label="APU Part Number" value={apu.part_number} />
                    <DetailItem
                        label="Last Shop Visit"
                        value={apu.last_shop_visit_date ? format(new Date(apu.last_shop_visit_date), "dd/MM/yyyy") : "-"}
                    />
                    <DetailItem label="APU Total Hours" value={apu.hours_since_new} />
                    <DetailItem label="APU Total Cycles" value={apu.cycles_since_new} />
                </DetailSection>

                {/* Main Landing Gear Left */}
                <DetailSection title="Section C: Main Landing Gear Left">
                    <DetailItem label="Manufacturer" value={mlgLeft.manufacturer} />
                    <DetailItem label="Model" value={mlgLeft.model} />
                    <DetailItem label="Serial No" value={mlgLeft.serial_number} />
                    <DetailItem label="Part Number" value={mlgLeft.part_number} />
                    <DetailItem
                        label="Last Shop Visit"
                        value={mlgLeft.last_shop_visit_date ? format(new Date(mlgLeft.last_shop_visit_date), "dd/MM/yyyy") : "-"}
                    />
                    <DetailItem label="Total Hours" value={mlgLeft.hours_since_new} />
                    <DetailItem label="Total Cycles" value={mlgLeft.cycles_since_new} />
                </DetailSection>

                {/* Main Landing Gear Right */}
                <DetailSection title="Section D: Main Landing Gear Right">
                    <DetailItem label="Manufacturer" value={mlgRight.manufacturer} />
                    <DetailItem label="Model" value={mlgRight.model} />
                    <DetailItem label="Serial No" value={mlgRight.serial_number} />
                    <DetailItem label="Part Number" value={mlgRight.part_number} />
                    <DetailItem
                        label="Last Shop Visit"
                        value={mlgRight.last_shop_visit_date ? format(new Date(mlgRight.last_shop_visit_date), "dd/MM/yyyy") : "-"}
                    />
                    <DetailItem label="Total Hours" value={mlgRight.hours_since_new} />
                    <DetailItem label="Total Cycles" value={mlgRight.cycles_since_new} />
                </DetailSection>

                {/* Nose Landing Gear */}
                <DetailSection title="Section E: Nose Landing Gear">
                    <DetailItem label="Manufacturer" value={nlg.manufacturer} />
                    <DetailItem label="Model" value={nlg.model} />
                    <DetailItem label="Serial No" value={nlg.serial_number} />
                    <DetailItem label="Part Number" value={nlg.part_number} />
                    <DetailItem
                        label="Last Shop Visit"
                        value={nlg.last_shop_visit_date ? format(new Date(nlg.last_shop_visit_date), "dd/MM/yyyy") : "-"}
                    />
                    <DetailItem label="Total Hours" value={nlg.hours_since_new} />
                    <DetailItem label="Total Cycles" value={nlg.cycles_since_new} />
                </DetailSection>
            </div>
        </div>
    );
};

export default AircraftDetails;
