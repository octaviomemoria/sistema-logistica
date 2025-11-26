# Clinic Nutricionistas App

This project is a web application designed for managing appointments and patient evolutions in a nutrition clinic. It provides a structured way to handle patient data, appointments, and their respective evolutions.

## Features

- **Patient Management**: Create, retrieve, update, and delete patient records.
- **Appointment Management**: Schedule, update, and cancel appointments.
- **Evolution Tracking**: Record observations and recommendations for each appointment.

## Project Structure

```
clinic-nutricionistas-app
├── src
│   ├── controllers          # Contains controllers for handling requests
│   │   ├── patientController.ts
│   │   └── appointmentController.ts
│   ├── models               # Contains data models for the application
│   │   ├── patient.ts
│   │   ├── appointment.ts
│   │   └── evolution.ts
│   ├── routes               # Contains route definitions
│   │   └── index.ts
│   ├── services             # Contains business logic
│   │   ├── patientService.ts
│   │   └── appointmentService.ts
│   ├── app.ts               # Entry point of the application
│   └── types                # Type definitions
│       └── index.d.ts
├── package.json             # NPM package configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd clinic-nutricionistas-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
npm start
```

The application will be available at `http://localhost:3000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.