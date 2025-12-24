import { Resend } from 'resend'

// Initialize Resend only if API key is present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendEmailProps {
    to: string
    subject: string
    html: string
}

export class EmailService {
    static async send({ to, subject, html }: SendEmailProps) {
        if (!process.env.RESEND_API_KEY) {
            console.log('--- [MOCK EMAIL SERVICE] ---')
            console.log(`To: ${to}`)
            console.log(`Subject: ${subject}`)
            console.log('--- HTML Content Truncated ---')
            return { success: true, id: 'mock-id' }
        }

        try {
            const data = await resend!.emails.send({
                from: 'Locnos <no-reply@locnos.com.br>',
                to,
                subject,
                html
            })
            return { success: true, id: data.data?.id }
        } catch (error) {
            console.error('Email Error:', error)
            return { success: false, error }
        }
    }
}
