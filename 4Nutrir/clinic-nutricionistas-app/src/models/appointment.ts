export class Appointment {
    id: number;
    patientId: number;
    date: Date;
    time: string;
    notes: string;

    constructor(id: number, patientId: number, date: Date, time: string, notes: string) {
        this.id = id;
        this.patientId = patientId;
        this.date = date;
        this.time = time;
        this.notes = notes;
    }
}