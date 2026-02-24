import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

const toFloat = (v: unknown): number | null =>
  v === '' || v === null || v === undefined ? null : Number(v);

const toDate = (v: unknown): Date | null => {
  if (!v || v === '') return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
};

router.get('/:aircraft_id', async (req, res) => {
  try {
    const { aircraft_id } = req.params;
    const logs = await prisma.journeyLog.findMany({
      where: { aircraft_id },
      include: {
        sectors: { orderBy: { sl_no: 'asc' } },
        defects: { orderBy: { sl_no: 'asc' } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching journey logs:', error);
    res.status(500).json({ error: 'Failed to fetch journey logs', details: (error as Error).message });
  }
});

router.get('/entry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const log = await prisma.journeyLog.findUnique({
      where: { id },
      include: {
        sectors: { orderBy: { sl_no: 'asc' } },
        defects: { orderBy: { sl_no: 'asc' } },
      },
    });
    if (!log) return res.status(404).json({ error: 'Journey log not found' });
    res.json(log);
  } catch (error) {
    console.error('Error fetching journey log:', error);
    res.status(500).json({ error: 'Failed to fetch journey log', details: (error as Error).message });
  }
});


router.post('/', async (req, res) => {
  try {
    const {
      aircraft_id,
      company_name,
      date,
      registration,
      aircraft_type,
      log_sl_no,
      pic_name,
      pic_license_no,
      pic_sign,
      commander_sign,
      fuel_arrival,
      fuel_departure,
      remaining_fuel_onboard,
      fuel_uplift,
      calculate_total_fuel,
      fuel_discrepancy,
      aircraft_total_hrs,
      aircraft_total_cyc,
      fuel_flight_deck_gauge,
      next_due_maintenance,
      due_at_date,
      due_at_hours,
      total_flight_hrs,
      total_flight_cyc,
      daily_inspection,
      type_of_maintenance,
      apu_hrs,
      apu_cyc,
      oil_uplift_eng1,
      oil_uplift_eng2,
      oil_uplift_apu,
      daily_inspection_sign,
      sign_stamp,
      sectors = [],
      defects = [],
    } = req.body;

    const log = await prisma.journeyLog.create({
      data: {
        aircraft_id,
        company_name,
        date: toDate(date) ?? new Date(),
        registration,
        aircraft_type,
        log_sl_no,
        pic_name,
        pic_license_no,
        pic_sign: pic_sign ?? 'No',
        commander_sign: commander_sign ?? 'No',
        fuel_arrival: toFloat(fuel_arrival),
        fuel_departure: toFloat(fuel_departure),
        remaining_fuel_onboard: toFloat(remaining_fuel_onboard),
        fuel_uplift: toFloat(fuel_uplift),
        calculate_total_fuel: toFloat(calculate_total_fuel),
        fuel_discrepancy: toFloat(fuel_discrepancy),
        aircraft_total_hrs: toFloat(aircraft_total_hrs),
        aircraft_total_cyc: toFloat(aircraft_total_cyc),
        fuel_flight_deck_gauge: toFloat(fuel_flight_deck_gauge),
        next_due_maintenance: toDate(next_due_maintenance),
        due_at_date: toDate(due_at_date),
        due_at_hours: toFloat(due_at_hours),
        total_flight_hrs: toFloat(total_flight_hrs),
        total_flight_cyc: toFloat(total_flight_cyc),
        daily_inspection: toDate(daily_inspection),
        type_of_maintenance,
        apu_hrs: toFloat(apu_hrs),
        apu_cyc: toFloat(apu_cyc),
        oil_uplift_eng1: toFloat(oil_uplift_eng1),
        oil_uplift_eng2: toFloat(oil_uplift_eng2),
        oil_uplift_apu: toFloat(oil_uplift_apu),
        daily_inspection_sign: daily_inspection_sign ?? 'No',
        sign_stamp: sign_stamp ?? 'No',
        sectors: {
          create: (sectors as any[]).map((s: any, idx: number) => ({
            sl_no: idx + 1,
            flight_num: s.flight_num,
            sector_from: s.sector_from,
            sector_to: s.sector_to,
            on_chock_dep_date: s.on_chock_dep_date,
            on_chock_dep_time: s.on_chock_dep_time,
            on_chock_arr_date: s.on_chock_arr_date,
            on_chock_arr_time: s.on_chock_arr_time,
            on_chock_duration: s.on_chock_duration,
            off_chock_dep_date: s.off_chock_dep_date,
            off_chock_dep_time: s.off_chock_dep_time,
            off_chock_arr_date: s.off_chock_arr_date,
            off_chock_arr_time: s.off_chock_arr_time,
            off_chock_duration: s.off_chock_duration,
          })),
        },
        defects: {
          create: (defects as any[]).map((d: any, idx: number) => ({
            sl_no: idx + 1,
            category: d.category ?? 'PIREP',
            defect_description: d.defect_description,
            action_taken: d.action_taken,
            mel_expiry_date: d.mel_expiry_date,
            mel_reference: d.mel_reference,
            mel_repair_cat: d.mel_repair_cat,
            lic_no: d.lic_no,
            part1_description: d.part1_description,
            part1_number_on: d.part1_number_on,
            part1_number_off: d.part1_number_off,
            part1_serial_on: d.part1_serial_on,
            part1_serial_off: d.part1_serial_off,
            part1_cert_num: d.part1_cert_num,
            part2_description: d.part2_description,
            part2_number_on: d.part2_number_on,
            part2_number_off: d.part2_number_off,
            part2_serial_on: d.part2_serial_on,
            part2_serial_off: d.part2_serial_off,
            part2_cert_num: d.part2_cert_num,
          })),
        },
      },
      include: {
        sectors: { orderBy: { sl_no: 'asc' } },
        defects: { orderBy: { sl_no: 'asc' } },
      },
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating journey log:', error);
    res.status(500).json({ error: 'Failed to create journey log', details: (error as Error).message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sectors,
      defects,
      ...fields
    } = req.body;

    // Convert numeric/date fields
    const data: any = { ...fields };
    const numFields = [
      'fuel_arrival', 'fuel_departure', 'remaining_fuel_onboard', 'fuel_uplift',
      'calculate_total_fuel', 'fuel_discrepancy', 'aircraft_total_hrs', 'aircraft_total_cyc',
      'fuel_flight_deck_gauge', 'due_at_hours', 'total_flight_hrs', 'total_flight_cyc',
      'apu_hrs', 'apu_cyc', 'oil_uplift_eng1', 'oil_uplift_eng2', 'oil_uplift_apu',
    ];
    const dateFields = ['date', 'next_due_maintenance', 'due_at_date', 'daily_inspection'];

    for (const f of numFields) {
      if (f in data) data[f] = toFloat(data[f]);
    }
    for (const f of dateFields) {
      if (f in data) data[f] = toDate(data[f]);
    }

    // Run in a transaction: update header, replace sectors & defects
    const log = await prisma.$transaction(async (tx) => {
      const updated = await tx.journeyLog.update({ where: { id }, data });

      if (sectors !== undefined) {
        await tx.journeyLogSector.deleteMany({ where: { journey_log_id: id } });
        if ((sectors as any[]).length > 0) {
          await tx.journeyLogSector.createMany({
            data: (sectors as any[]).map((s: any, idx: number) => ({
              journey_log_id: id,
              sl_no: idx + 1,
              flight_num: s.flight_num,
              sector_from: s.sector_from,
              sector_to: s.sector_to,
              on_chock_dep_date: s.on_chock_dep_date,
              on_chock_dep_time: s.on_chock_dep_time,
              on_chock_arr_date: s.on_chock_arr_date,
              on_chock_arr_time: s.on_chock_arr_time,
              on_chock_duration: s.on_chock_duration,
              off_chock_dep_date: s.off_chock_dep_date,
              off_chock_dep_time: s.off_chock_dep_time,
              off_chock_arr_date: s.off_chock_arr_date,
              off_chock_arr_time: s.off_chock_arr_time,
              off_chock_duration: s.off_chock_duration,
            })),
          });
        }
      }

      if (defects !== undefined) {
        await tx.journeyLogDefect.deleteMany({ where: { journey_log_id: id } });
        if ((defects as any[]).length > 0) {
          await tx.journeyLogDefect.createMany({
            data: (defects as any[]).map((d: any, idx: number) => ({
              journey_log_id: id,
              sl_no: idx + 1,
              category: d.category ?? 'PIREP',
              defect_description: d.defect_description,
              action_taken: d.action_taken,
              mel_expiry_date: d.mel_expiry_date,
              mel_reference: d.mel_reference,
              mel_repair_cat: d.mel_repair_cat,
              lic_no: d.lic_no,
              part1_description: d.part1_description,
              part1_number_on: d.part1_number_on,
              part1_number_off: d.part1_number_off,
              part1_serial_on: d.part1_serial_on,
              part1_serial_off: d.part1_serial_off,
              part1_cert_num: d.part1_cert_num,
              part2_description: d.part2_description,
              part2_number_on: d.part2_number_on,
              part2_number_off: d.part2_number_off,
              part2_serial_on: d.part2_serial_on,
              part2_serial_off: d.part2_serial_off,
              part2_cert_num: d.part2_cert_num,
            })),
          });
        }
      }

      return tx.journeyLog.findUnique({
        where: { id },
        include: {
          sectors: { orderBy: { sl_no: 'asc' } },
          defects: { orderBy: { sl_no: 'asc' } },
        },
      });
    });

    res.json(log);
  } catch (error) {
    console.error('Error updating journey log:', error);
    res.status(500).json({ error: 'Failed to update journey log', details: (error as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.journeyLog.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting journey log:', error);
    res.status(500).json({ error: 'Failed to delete journey log', details: (error as Error).message });
  }
});

export default router;
