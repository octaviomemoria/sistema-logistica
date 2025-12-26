import { NextResponse } from "next/server";
import { parseOfx } from "@/lib/ofx-parser";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const text = await file.text();
        const transactions = await parseOfx(text);

        return NextResponse.json(transactions);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to parse OFX" }, { status: 500 });
    }
}
