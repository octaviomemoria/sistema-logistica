'use server'

import { prisma } from '@/lib/prisma'
import { startOfDay, addDays, isWithinInterval, endOfDay, format, isSameDay } from 'date-fns'

export type AvailabilityMatrix = {
    [equipmentId: string]: {
        name: string;
        totalQty: number;
        dailyAvailability: number[]; // Index maps to dates array
    }
}

export type RentalDetail = {
    id: string;
    personName: string;
    equipmentName: string;
    quantity: number;
    startDate: Date;
    endDate: Date;
}

export async function getAvailabilityData(startDateStr?: string, days: number = 16) {
    const startDate = startDateStr ? startOfDay(new Date(startDateStr)) : startOfDay(new Date());
    const endDate = endOfDay(addDays(startDate, days - 1));

    // 1. Generate array of dates
    const dates = Array.from({ length: days }, (_, i) => addDays(startDate, i));

    // 2. Fetch all equipment
    const equipmentList = await prisma.equipment.findMany({
        orderBy: { name: 'asc' }
    });

    // 3. Fetch active rentals in range
    // We want rentals that overlap with [startDate, endDate]
    // Overlap condition: RentalStart <= QueryEnd AND RentalEnd >= QueryStart
    const rentals = await prisma.rental.findMany({
        where: {
            status: {
                in: ['SCHEDULED', 'ACTIVE', 'LATE', 'COMPLETED'] // Include COMPLETED to show history if viewing past
            },
            startDate: { lte: endDate },
            endDate: { gte: startDate }
        },
        include: {
            person: true,
            items: {
                include: {
                    equipment: true
                }
            }
        }
    });

    // 4. Build Matrix and Rental list
    const matrix: AvailabilityMatrix = {};
    const rentalDetails: RentalDetail[] = [];

    // Initialize matrix for all equipment
    equipmentList.forEach(eq => {
        matrix[eq.id] = {
            name: eq.name,
            totalQty: eq.totalQty,
            dailyAvailability: new Array(days).fill(eq.totalQty)
        };
    });

    // Process rentals to deduct quantities
    rentals.forEach(rental => {
        // For each item in rental
        rental.items.forEach(item => {
            const eqId = item.equipmentId;
            if (!matrix[eqId]) return; // Should not happen if integrity is maintained

            // Add to detailed list (flattened)
            // Filter to show only relevant ones for the bottom table if needed, 
            // but the prompt implies listing rentals relevant to the period.
            // Let's add if it overlaps the period (which the DB query ensures)
            rentalDetails.push({
                id: rental.id,
                personName: rental.person.name,
                equipmentName: item.equipment.name,
                quantity: item.quantity,
                startDate: rental.startDate,
                endDate: rental.endDate
            });

            // Update matrix availability
            // Loop through the report days
            dates.forEach((date, index) => {
                // Check if this date is within the rental period
                // Using isWithinInterval or simple comparison
                if (date >= startOfDay(rental.startDate) && date <= endOfDay(rental.endDate)) {
                    matrix[eqId].dailyAvailability[index] -= item.quantity;
                }
            });
        });
    });

    // Sort rental details by date
    rentalDetails.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return {
        dates: dates.map(d => format(d, 'yyyy-MM-dd')), // Return formatted strings for serialization
        formattedDatesMd: dates.map(d => ({ day: format(d, 'dd'), month: format(d, 'MMM') })),
        matrix,
        rentalDetails
    }
}
