import { Router } from 'express';
import PatientController from '../controllers/patientController';
import AppointmentController from '../controllers/appointmentController';

const router = Router();
const patientController = new PatientController();
const appointmentController = new AppointmentController();

export function setRoutes(app) {
    // Patient routes
    router.post('/patients', patientController.createPatient);
    router.get('/patients/:id', patientController.getPatient);
    router.put('/patients/:id', patientController.updatePatient);
    router.delete('/patients/:id', patientController.deletePatient);

    // Appointment routes
    router.post('/appointments', appointmentController.createAppointment);
    router.get('/appointments/:id', appointmentController.getAppointment);
    router.put('/appointments/:id', appointmentController.updateAppointment);
    router.delete('/appointments/:id', appointmentController.deleteAppointment);

    app.use('/api', router);
}