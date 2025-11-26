export class Evolution {
    id: number;
    appointmentId: number;
    observations: string;
    recommendations: string;

    constructor(id: number, appointmentId: number, observations: string, recommendations: string) {
        this.id = id;
        this.appointmentId = appointmentId;
        this.observations = observations;
        this.recommendations = recommendations;
    }
}