import apiClient from "./axios";

/**
 * Busca leituras pendentes do Directus
 * @returns {Promise} Promise com as leituras pendentes
 */
export const getLeiturasPendentes = async () => {
    try {
        // Busca leituras com status = pendente
        const response = await apiClient.get("/items/leituras_unidades", {
            params: {
                filter: { status: { _eq: "pendente" } },
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