class PatientController {
    constructor(patientService) {
        this.patientService = patientService;
    }

    async createPatient(req, res) {
        try {
            const patientData = req.body;
            const newPatient = await this.patientService.addPatient(patientData);
            res.status(201).json(newPatient);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getPatient(req, res) {
        try {
            const patientId = req.params.id;
            const patient = await this.patientService.getPatientById(patientId);
            if (patient) {
                res.status(200).json(patient);
            } else {
                res.status(404).json({ message: 'Patient not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async updatePatient(req, res) {
        try {
            const patientId = req.params.id;
            const updatedData = req.body;
            const updatedPatient = await this.patientService.updatePatient(patientId, updatedData);
            if (updatedPatient) {
                res.status(200).json(updatedPatient);
            } else {
                res.status(404).json({ message: 'Patient not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async deletePatient(req, res) {
        try {
            const patientId = req.params.id;
            const deleted = await this.patientService.deletePatient(patientId);
            if (deleted) {
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Patient not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default PatientController;