import { parse } from 'ofx-js';

export interface OFXTransaction {
    id: string;
    amount: number;
    description: string;
    date: Date;
    type: 'CREDIT' | 'DEBIT';
}

export async function parseOfx(ofxString: string): Promise<OFXTransaction[]> {
    try {
        const data = await parse(ofxString);

        // Navigate through OFX structure to find transactions
        // Standard Structure: OFX -> BANKMSGSRSV1 -> STMTTRNRS -> STMTRS -> BANKTRANLIST -> STMTTRN
        const transactions = data.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;

        // Handle single transaction object vs array
        const list = Array.isArray(transactions) ? transactions : [transactions];

        return list.map((tx: any) => ({
            id: tx.FITID,
            amount: parseFloat(tx.TRNAMT),
            description: tx.MEMO,
            date: parseOfxDate(tx.DTPOSTED),
            type: parseFloat(tx.TRNAMT) > 0 ? 'CREDIT' : 'DEBIT'
        }));

    } catch (e) {
        console.error("OFX Parse Error", e);
        throw new Error("Invalid OFX File");
    }
}

function parseOfxDate(dateStr: string): Date {
    // OFX Date Format: YYYYMMDDHHMMSS or YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
}
