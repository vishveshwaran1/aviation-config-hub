export interface Aircraft {
  id: string;
  model: string;
  msn: string;
  registration_number: string;
  manufacture_date: string | null;
  delivery_date: string | null;
  flight_hours: number;
  flight_cycles: number;
  engines_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AircraftComponent {
  id: string;
  aircraft_id: string;
  section: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  part_number: string | null;
  last_shop_visit_date: string | null;
  hours_since_new: number;
  cycles_since_new: number;
  tsi: number | null;           // Time Since Installation
  csi: number | null;           // Cycles Since Installation
  created_at: string;
  updated_at: string;
}

export interface Component {
  id: string;
  manufacturer: string;
  name: string;
  part_number: string;
  cmm_number: string | null;
  classification: string | null;
  classification_date: string | null;
  class_linkage: string | null;
  compatible_aircraft_models: string[] | null;
  estimated_price: number | null;
  quotation_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  aircraft_model: string;
  task_name: string;
  mpd_id: string | null;
  amm_id: string | null;
  task_card_ref: string | null;
  description: string | null;
  assigned_component_id: string | null;
  zones: string[] | null;
  estimated_manhours: number | null;
  estimated_price: number | null;
  quotation_price: number | null;
  interval_threshold: number | null;
  repeat_interval: number | null;
  interval_unit: string;          // "Hours" | "Cycles"
  created_at: string;
  updated_at: string;
}

export interface Forecast {
  id: string;
  aircraft_id: string;
  service_id: string;
  interval_unit: string;          // "Hours" | "Cycles"
  last_date: string | null;
  last_hours: number | null;
  last_cycles: number | null;
  next_date: string | null;
  next_hours: number | null;
  next_cycles: number | null;
  remaining_hours: number | null;
  remaining_cycles: number | null;
  avg_hours: number | null;
  avg_cycles: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}
