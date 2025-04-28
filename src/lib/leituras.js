import apiClient from "./axios";

/**
 * Busca leituras pendentes do Directus
 * @returns {Promise} Promise com as leituras pendentes
 */
export const getLeiturasPendentes = async () => {
    try {
        const leiturasEndpoint = process.env.NEXT_PUBLIC_LEITURAS_UNIDADES_ENDPOINT;
        const statusPendente = process.env.NEXT_PUBLIC_STATUS_PENDENTE;

        // Busca leituras com status = pendente
        const response = await apiClient.get(leiturasEndpoint, {
            params: {
                filter: { status: { _eq: statusPendente } },
                sort: ["-date_created"],
            },
        });

        if (response.data && response.data.data) {
            return response.data.data;
        }

        return [];
    } catch (error) {
        console.error("Erro ao buscar leituras pendentes:", error);
        throw error;
    }
};