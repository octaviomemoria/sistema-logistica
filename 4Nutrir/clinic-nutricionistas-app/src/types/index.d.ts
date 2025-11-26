export interface Patient {
    id: string;
    name: string;
    age: number;
    medicalHistory: string[];
}

export interface Appointment {
    id: string;
    patientId: string;
    date: string; // ISO date string
    time: string; // Time in HH:mm format
    notes: string;
}

export interface Evolution {
    id: string;
    appointmentId: string;
    observations: string;
    recommendations: string;
}