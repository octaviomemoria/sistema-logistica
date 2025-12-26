import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export enum InventoryType {
    RENTAL_OUT = "RENTAL_OUT",
    RENTAL_RETURN = "RENTAL_RETURN",
    MAINTENANCE_OUT = "MAINTENANCE_OUT",
    MAINTENANCE_RETURN = "MAINTENANCE_RETURN",
    ADJUSTMENT = "ADJUSTMENT",
    PURCHASE = "PURCHASE"
}

export class InventoryService {

    /**
     * Registers an Inventory Movement and updates Equipment Stock
     * Atomic Operation
     */
    static async registerMovement(data: {
        tenantId: string;
        equipmentId: string;
        quantity: number; // Positive = IN, Negative = OUT
        type: InventoryType;
        rentalId?: string;
        maintenanceId?: string;
        userId?: string;
        reason?: string;
    }, externalTx?: any) {

        const runLogic = async (tx: any) => {
            // 1. Validate Stock for OUT movements
            if (data.quantity < 0) {
                const equipment = await tx.equipment.findUnique({
                    where: { id: data.equipmentId }
                });

                if (!equipment) throw new Error("Equipment not found");

                // Assuming 'rentedQty' tracks items OUT.
                // If we are sending OUT, rentedQty increases.
                // Wait, logical mismatch in previous plan vs schema.
                // Standard: 'rentedQty' = Items currently out.
                // Available = Total - Rented.
                // So if we Move OUT (Negative Qty in Movement?), we INCREMENT rentedQty.
                // Let's stick to explicit meaning: 'quantity' in movement is change in STOCK?
                // Or change in RENTED?
                // Best practice: 'quantity' is change in AVAILABLE stock.
                // OUT = -1. IN = +1.

                // Check availability
                const available = equipment.totalQty - equipment.rentedQty;
                if (Math.abs(data.quantity) > available) {
                    throw new Error(`Insufficient stock for ${equipment.name}. Available: ${available}`);
                }
            }

            // 2. Create Movement Record
            await tx.inventoryMovement.create({
                data: {
                    tenantId: data.tenantId,
                    equipmentId: data.equipmentId,
                    quantity: data.quantity,
                    type: data.type,
                    rentalId: data.rentalId,
                    maintenanceId: data.maintenanceId,
                    userId: data.userId,
                    reason: data.reason
                }
            });

            // 3. Update Equipment Counters
            // If Type is RENTAL_OUT (Qty -X), we INCREMENT rentedQty by X.
            // If Type is RENTAL_RETURN (Qty +X), we DECREMENT rentedQty by X.

            const qtyChange = Math.abs(data.quantity);

            if (data.type === InventoryType.RENTAL_OUT) {
                await tx.equipment.update({
                    where: { id: data.equipmentId },
                    data: { rentedQty: { increment: qtyChange } }
                });
            } else if (data.type === InventoryType.RENTAL_RETURN) {
                await tx.equipment.update({
                    where: { id: data.equipmentId },
                    data: { rentedQty: { decrement: qtyChange } }
                });
            } else if (data.type === InventoryType.PURCHASE) {
                await tx.equipment.update({
                    where: { id: data.equipmentId },
                    data: { totalQty: { increment: qtyChange } }
                });
            }
            // Maintenance logic similar to rental
            else if (data.type === InventoryType.MAINTENANCE_OUT) {
                // Maybe track 'maintenanceQty'? For now just rentedQty or a new field.
                // Let's assume maintenance also consumes availability.
                // For MVP, if we don't have maintenanceQty, we can use rentedQty or just rely on Available = Total - Rented.
                // BUT if we don't inc rentedQty, availability won't decrease.
                // So we treat as rentedQty for now or add 'maintenanceQty' later.
                await tx.equipment.update({
                    where: { id: data.equipmentId },
                    data: { rentedQty: { increment: qtyChange } } // Temporarily using rentedQty to block stock
                });
            } else if (data.type === InventoryType.MAINTENANCE_RETURN) {
                await tx.equipment.update({
                    where: { id: data.equipmentId },
                    data: { rentedQty: { decrement: qtyChange } }
                });
            }
        };

        if (externalTx) {
            return runLogic(externalTx);
        } else {
            return prisma.$transaction(runLogic);
        }
    }
}
