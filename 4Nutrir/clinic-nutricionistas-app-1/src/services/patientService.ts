export class PatientService {
    private patients: Patient[] = [];

    public addPatient(patient: Patient): Patient {
        this.patients.push(patient);
        return patient;
    }

    public getPatient(id: number): Patient | undefined {
        return this.patients.find(patient => patient.id === id);
    }

    public updatePatient(updatedPatient: Patient): Patient | undefined {
        const index = this.patients.findIndex(patient => patient.id === updatedPatient.id);
        if (index !== -1) {
            this.patients[index] = updatedPatient;
            return updatedPatient;
        }
        return undefined;
    }

    public deletePatient(id: number): boolean {
        const index = this.patients.findIndex(patient => patient.id === id);
        if (index !== -1) {
            this.patients.splice(index, 1);
            return true;
        }
        return false;
    }
}