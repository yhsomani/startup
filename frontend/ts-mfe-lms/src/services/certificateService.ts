import springApi from './springApi';

export interface CertificateResponse {
    certificateId: string;
    certificateUrl: string;
    verificationCode: string;
    issuedAt: string;
}

/**
 * Service for certificate operations.
 */
export const certificateService = {
    /**
     * Request certificate generation for an enrollment.
     * @param enrollmentId Enrollment ID
     */
    generateCertificate: async (enrollmentId: string): Promise<CertificateResponse> => {
        const response = await springApi.post<CertificateResponse>(`/enrollments/${enrollmentId}/certificate`);
        return response.data;
    },

    /**
     * Download a certificate PDF.
     * @param fileName The filename of the certificate
     */
    downloadCertificate: async (fileName: string): Promise<void> => {
        const response = await springApi.get(`/certificates/download/${fileName}`, {
            responseType: 'blob'
        });

        // Create a link and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Get certificate details by enrollment ID (if exists).
     * @param enrollmentId Enrollment ID
     */
    getCertificate: async (enrollmentId: string): Promise<CertificateResponse | null> => {
        try {
            // Re-using the generate endpoint since it returns existing if present
            const response = await springApi.post<CertificateResponse>(`/enrollments/${enrollmentId}/certificate`);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch certificate", err);
            return null;
        }
    }
};
