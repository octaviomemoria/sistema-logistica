import { Request, Response } from 'express';
import AppointmentService from '../services/appointmentService';

class AppointmentController {
    private appointmentService: AppointmentService;

    constructor() {
        this.appointmentService = new AppointmentService();
    }

    public createAppointment = async (req: Request, res: Response): Promise<void> => {
        try {
            const appointmentData = req.body;
            const newAppointment = await this.appointmentService.createAppointment(appointmentData);
            res.status(201).json(newAppointment);
        } catch (error) {
            res.status(500).json({ message: 'Error creating appointment', error });
        }
    };

    public getAppointment = async (req: Request, res: Response): Promise<void> => {
        try {
            const appointmentId = req.params.id;
            const appointment = await this.appointmentService.getAppointment(appointmentId);
            if (appointment) {
                res.status(200).json(appointment);
            } else {
                res.status(404).json({ message: 'Appointment not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving appointment', error });
        }
    };

    public updateAppointment = async (req: Request, res: Response): Promise<void> => {
        try {
            const appointmentId = req.params.id;
            const appointmentData = req.body;
            const updatedAppointment = await this.appointmentService.updateAppointment(appointmentId, appointmentData);
            if (updatedAppointment) {
                res.status(200).json(updatedAppointment);
            } else {
                res.status(404).json({ message: 'Appointment not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error updating appointment', error });
        }
    };

    public deleteAppointment = async (req: Request, res: Response): Promise<void> => {
        try {
            const appointmentId = req.params.id;
            const result = await this.appointmentService.deleteAppointment(appointmentId);
            if (result) {
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Appointment not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error deleting appointment', error });
        }
    };
}

export default AppointmentController;