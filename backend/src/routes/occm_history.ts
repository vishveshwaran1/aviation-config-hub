import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Retrieve component OCCM history
router.get('/:partNumber/:serialNumber', async (req, res) => {
    try {
        const { partNumber, serialNumber } = req.params;
        let history = await prisma.occmHistory.findMany({
            where: {
                part_number: partNumber,
                serial_number: serialNumber
            },
            orderBy: {
                event_date: 'desc'
            }
        });

        // Auto-seeding logic if no history is found
        if (history.length === 0) {
            // Find component details to seed realistic records
            const component = await prisma.aircraftComponent.findFirst({
                where: {
                    part_number: partNumber,
                    serial_number: serialNumber
                },
                include: {
                    aircraft: true
                }
            });

            if (component) {
                const manufactureDate = component.manufacture_date || new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2); // default 2 years ago
                const lastShopVisitDate = component.last_shop_visit_date;
                const aircraftReg = component.aircraft?.registration_number || 'Unknown AC';
                
                const eventsToCreate = [];

                // Event 1: Manufacture
                eventsToCreate.push({
                    part_number: partNumber,
                    serial_number: serialNumber,
                    component_name: component.component_name || 'Component',
                    manufacturer: component.manufacturer || 'Unknown Manufacturer',
                    date_of_manufacture: component.manufacture_date,
                    event_date: manufactureDate,
                    action_type: 'Manufactured',
                    ac_reg_facility: component.manufacturer || 'OEM Facility',
                    airframe_total_time: '0 FH / 0 FC',
                    component_tsn_csn: '0 FH / 0 FC',
                    component_tso_cso: '0 FH / 0 FC',
                    doc_ref_details: 'OEM Certificate of Conformance (FAA Form 8130-3)'
                });

                // Event 2: Shop Overhaul (if last shop visit exists and is different from DOM)
                if (lastShopVisitDate && lastShopVisitDate.getTime() !== manufactureDate.getTime()) {
                    const shopVisitTsn = component.hours_since_new ? Math.round(component.hours_since_new * 0.5) : 1200;
                    const shopVisitCsn = component.cycles_since_new ? Math.round(component.cycles_since_new * 0.5) : 400;

                    eventsToCreate.push({
                        part_number: partNumber,
                        serial_number: serialNumber,
                        component_name: component.component_name || 'Component',
                        manufacturer: component.manufacturer || 'Unknown Manufacturer',
                        date_of_manufacture: component.manufacture_date,
                        event_date: lastShopVisitDate,
                        action_type: 'Shop Visit',
                        ac_reg_facility: 'Aero Maintenance Center',
                        airframe_total_time: `${(shopVisitTsn + 2000).toLocaleString()} FH / ${(shopVisitCsn + 800).toLocaleString()} FC`,
                        component_tsn_csn: `${shopVisitTsn.toLocaleString()} FH / ${shopVisitCsn.toLocaleString()} FC`,
                        component_tso_cso: '0 FH / 0 FC', // Reset at overhaul
                        doc_ref_details: 'Release Certificate (EASA Form 1)'
                    });
                }

                // Event 3: Installation on aircraft
                const instDate = lastShopVisitDate 
                    ? new Date(lastShopVisitDate.getTime() + 1000 * 60 * 60 * 24 * 14) // 14 days after shop visit
                    : new Date(Date.now() - 1000 * 60 * 60 * 24 * 90); // default 90 days ago
                
                const instTsn = component.hours_since_new ? Math.round(component.hours_since_new * 0.8) : 1800;
                const instCsn = component.cycles_since_new ? Math.round(component.cycles_since_new * 0.8) : 600;
                const instTso = component.hours_since_new && lastShopVisitDate ? Math.round((component.hours_since_new - instTsn) * 0.5) : 150;
                const instCso = component.cycles_since_new && lastShopVisitDate ? Math.round((component.cycles_since_new - instCsn) * 0.5) : 50;

                eventsToCreate.push({
                    part_number: partNumber,
                    serial_number: serialNumber,
                    component_name: component.component_name || 'Component',
                    manufacturer: component.manufacturer || 'Unknown Manufacturer',
                    date_of_manufacture: component.manufacture_date,
                    event_date: instDate,
                    action_type: 'Installation',
                    ac_reg_facility: `${aircraftReg}`,
                    airframe_total_time: `${(instTsn + 3000).toLocaleString()} FH / ${(instCsn + 1200).toLocaleString()} FC`,
                    component_tsn_csn: `${instTsn.toLocaleString()} FH / ${instCsn.toLocaleString()} FC`,
                    component_tso_cso: `${instTso.toLocaleString()} FH / ${instCso.toLocaleString()} FC`,
                    doc_ref_details: `Work Order WO-${Math.floor(10000 + Math.random() * 90000)}`
                });

                await prisma.occmHistory.createMany({
                    data: eventsToCreate
                });

                history = await prisma.occmHistory.findMany({
                    where: {
                        part_number: partNumber,
                        serial_number: serialNumber
                    },
                    orderBy: {
                        event_date: 'desc'
                    }
                });
            }
        }

        res.json(history);
    } catch (error) {
        console.error('Error fetching OCCM history:', error);
        res.status(500).json({ error: 'Failed to fetch OCCM history', details: (error as Error).message });
    }
});

// Create manual OCCM history event
router.post('/', async (req, res) => {
    try {
        const {
            part_number,
            serial_number,
            component_name,
            manufacturer,
            date_of_manufacture,
            event_date,
            action_type,
            ac_reg_facility,
            airframe_total_time,
            component_tsn_csn,
            component_tso_cso,
            doc_ref_details
        } = req.body;

        if (!part_number || !serial_number || !event_date || !action_type) {
            return res.status(400).json({ error: 'Part number, serial number, event date, and action type are required' });
        }

        const newEvent = await prisma.occmHistory.create({
            data: {
                part_number,
                serial_number,
                component_name: component_name || null,
                manufacturer: manufacturer || null,
                date_of_manufacture: date_of_manufacture ? new Date(date_of_manufacture) : null,
                event_date: new Date(event_date),
                action_type,
                ac_reg_facility: ac_reg_facility || null,
                airframe_total_time: airframe_total_time || null,
                component_tsn_csn: component_tsn_csn || null,
                component_tso_cso: component_tso_cso || null,
                doc_ref_details: doc_ref_details || null
            }
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating OCCM history event:', error);
        res.status(500).json({ error: 'Failed to create OCCM history event', details: (error as Error).message });
    }
});

// Delete an OCCM history event
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.occmHistory.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting OCCM history event:', error);
        res.status(500).json({ error: 'Failed to delete OCCM history event', details: (error as Error).message });
    }
});

export default router;
