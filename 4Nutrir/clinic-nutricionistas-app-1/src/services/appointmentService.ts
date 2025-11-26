class AppointmentService {
    constructor() {
        this.appointments = [];
    }

    createAppointment(appointment) {
        this.appointments.push(appointment);
        return appointment;
    }

    getAppointment(id) {
        return this.appointments.find(appointment => appointment.id === id);
    }

    updateAppointment(id, updatedAppointment) {
        const index = this.appointments.findIndex(appointment => appointment.id === id);
        if (index !== -1) {
            this.appointments[index] = { ...this.appointments[index], ...updatedAppointment };
            return this.appointments[index];
        }
        return null;
    }

    deleteAppointment(id) {
        const index = this.appointments.findIndex(appointment => appointment.id === id);
        if (index !== -1) {
            return this.appointments.splice(index, 1)[0];
        }
        return null;
    }
}

module.exports = AppointmentService;