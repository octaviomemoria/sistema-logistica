import { google } from 'googleapis';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

// Configuração do OAuth2 Client para Google Drive
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI
);

// Definir o refresh token
if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    });
}

// Cliente do Google Drive
export const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});

/**
 * Faz upload de um arquivo para o Google Drive
 * @param nomeArquivo - Nome do arquivo
 * @param mimeType - Tipo MIME do arquivo (ex: 'image/png')
 * @param buffer - Buffer contendo os dados do arquivo
 * @returns URL pública do arquivo ou ID do arquivo
 */
export async function uploadParaDrive(
    nomeArquivo: string,
    mimeType: string,
    buffer: Buffer
): Promise<string> {
    try {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!folderId) {
            throw new Error('GOOGLE_DRIVE_FOLDER_ID não configurado');
        }

        // Criar stream do buffer
        const stream = Readable.from(buffer);

        // Upload do arquivo
        const response = await drive.files.create({
            requestBody: {
                name: nomeArquivo,
                parents: [folderId],
                mimeType: mimeType
            },
            media: {
                mimeType: mimeType,
                body: stream
            },
            fields: 'id, webViewLink, webContentLink'
        });

        const fileId = response.data.id;

        if (!fileId) {
            throw new Error('Falha ao obter ID do arquivo após upload');
        }

        // Tornar o arquivo público (opcional, dependendo dos requisitos de segurança)
        // Remova esta seção se preferir manter os arquivos privados
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Retornar URL de visualização
        const viewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

        return viewLink;
    } catch (erro) {
        console.error('Erro ao fazer upload para Google Drive:', erro);
        throw new Error('Falha ao fazer upload do arquivo');
    }
}

/**
 * Deleta um arquivo do Google Drive pelo ID
 * @param fileId - ID do arquivo no Google Drive
 */
export async function deletarDoDrive(fileId: string): Promise<void> {
    try {
        await drive.files.delete({
            fileId: fileId
        });
    } catch (erro) {
        console.error('Erro ao deletar arquivo do Google Drive:', erro);
        throw new Error('Falha ao deletar arquivo');
    }
}

/**
 * Extrai o ID do arquivo de uma URL do Google Drive
 * @param url - URL do Google Drive
 * @returns ID do arquivo
 */
export function extrairFileId(url: string): string | null {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

export default drive;
