import axios from 'axios'

const baseURL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3'
const apiKey = process.env.ASAAS_API_KEY || ''

export const asaas = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Locnos API',
    'access_token': apiKey,
    'X-Api-Key': apiKey, // Asaas supports X-Api-Key (preferred), access_token kept for compatibility
  },
})

export type AsaasCustomer = {
  id: string
  name: string
  email?: string
  cpfCnpj?: string
  mobilePhone?: string
}

export type AsaasPayment = {
  id: string
  bankSlipUrl?: string
  invoiceUrl?: string
  status: string
}
