import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FormState {
  part_number: string;
  serial_number: string;
  model: string;                // Description
  section: string;              // POS / Position
  manufacturer: string;
  last_shop_visit_date: string; // INST Date
  hours_since_new: string;      // TSN
  cycles_since_new: string;     // CSN
  tsi: string;                  // Time Since Installation
  csi: string;                  // Cycles Since Installation
}

const EMPTY: FormState = {
  part_number: "",
  serial_number: "",
  model: "",
  section: "",
  manufacturer: "",
  last_shop_visit_date: "",
  hours_since_new: "",
  cycles_since_new: "",
  tsi: "",
  csi: "",
};


const toInputDate = (d?: string | null) => {
  if (!d) return "";
  try {
    return new Date(d).toISOString().substring(0, 10);
  } catch {
    return "";
  }
};

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[200px_1fr] sm:items-start sm:gap-4">
    <div className="pt-2">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
    </div>
    <div>{children}</div>
  </div>
);

const OccmForm = () => {
  const { id, componentId } = useParams<{ id: string; componentId: string }>();
  const navigate = useNavigate();

  const [form, setForm]       = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  /* ── Load component ── */
  useEffect(() => {
    if (!id || !componentId) return;
    api.aircraftComponents
      .getForAircraft(id)
      .then((data: any[]) => {
        const comp = Array.isArray(data) ? data.find((c) => c.id === componentId) : null;
        if (comp) {
          setForm({
            part_number:          comp.part_number          ?? "",
            serial_number:        comp.serial_number        ?? "",
            model:                comp.model                ?? "",
            section:              comp.section              ?? "",
            manufacturer:         comp.manufacturer         ?? "",
            last_shop_visit_date: toInputDate(comp.last_shop_visit_date),
            hours_since_new:      comp.hours_since_new  != null ? String(comp.hours_since_new)  : "",
            cycles_since_new:     comp.cycles_since_new != null ? String(comp.cycles_since_new) : "",
            tsi:                  comp.tsi != null ? String(comp.tsi) : "",
            csi:                  comp.csi != null ? String(comp.csi) : "",
          });
        } else {
          toast.error("Component not found.");
          navigate(-1);
        }
      })
      .catch(() => {
        toast.error("Failed to load component.");
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [id, componentId]);

  /* ── Handlers ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentId) return;

    // Basic validation
    if (!form.part_number.trim() || !form.serial_number.trim()) {
      toast.error("Part No. and Serial No. are required.");
      return;
    }

    setSaving(true);
    try {
      await api.aircraftComponents.update(componentId, {
        part_number:          form.part_number.trim(),
        serial_number:        form.serial_number.trim(),
        model:                form.model.trim(),
        section:              form.section.trim(),
        manufacturer:         form.manufacturer.trim(),
        last_shop_visit_date: form.last_shop_visit_date || null,
        hours_since_new:      form.hours_since_new  !== "" ? parseFloat(form.hours_since_new)  : null,
        cycles_since_new:     form.cycles_since_new !== "" ? parseFloat(form.cycles_since_new) : null,
        tsi:                  form.tsi !== "" ? parseFloat(form.tsi) : null,
        csi:                  form.csi !== "" ? parseFloat(form.csi) : null,
      });
      toast.success("Component updated successfully.");
      navigate(`/aircraft/${id}/occm`);
    } catch {
      toast.error("Failed to update component.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Loading component…
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-3xl">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            OCCM Panel / Edit Component
          </p>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">COMPONENT</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

          {/* Identification */}
          <div className="space-y-4">

            <Field label="Component Part No." >
              <Input
                name="part_number"
                value={form.part_number}
                onChange={handleChange}
                placeholder="e.g. 3873700-4"
                maxLength={60}
                autoComplete="off"
              />
            </Field>

            <Field label="Serial No">
              <Input
                name="serial_number"
                value={form.serial_number}
                onChange={handleChange}
                placeholder="e.g. SN-00412"
                maxLength={60}
                autoComplete="off"
              />
            </Field>

            <Field label="Description" >
              <Input
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="e.g. Air Data Computer"
                maxLength={255}
                autoComplete="off"
              />
            </Field>

            <Field label="POS">
              <Input
                name="section"
                value={form.section}
                onChange={handleChange}
                placeholder="e.g. 34-10-01"
                maxLength={120}
                autoComplete="off"
              />
            </Field>

            <Field label="INST Date">
              <Input
                type="date"
                name="last_shop_visit_date"
                value={form.last_shop_visit_date}
                onChange={handleChange}
              />
            </Field>

            <Field label="TSN">
              <Input
                type="number"
                name="hours_since_new"
                value={form.hours_since_new}
                onChange={handleChange}
                placeholder="0"
                min={0}
                step="0.1"
              />
            </Field>

            <Field label="CSN" >
              <Input
                type="number"
                name="cycles_since_new"
                value={form.cycles_since_new}
                onChange={handleChange}
                placeholder="0"
                min={0}
                step="1"
              />
            </Field>

            <Field label="TSI">
              <Input
                type="number"
                name="tsi"
                value={form.tsi}
                onChange={handleChange}
                placeholder="0"
                min={0}
                step="0.1"
              />
            </Field>

            <Field label="CSI">
              <Input
                type="number"
                name="csi"
                value={form.csi}
                onChange={handleChange}
                placeholder="0"
                min={0}
                step="1"
              />
            </Field>

          </div>

          {/* Actions */}
          <div className="flex justify-center items-center gap-3 pt-2 border-t">
            <Button
              type="submit"
              disabled={saving}
              className="gap-1.5 bg-[#17d488] hover:bg-[#1cc45f]"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Update"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5 bg-[#68686f] hover:bg-[#585d65]"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>

        </form>
      </div>



    </div>
  );
};

export default OccmForm;
