import axios from "axios";

// Substitua pela URL da sua API Directus
const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";

// Verificar e limpar tokens inválidos no carregamento
if (typeof window !== "undefined") {
    // Limpa tokens se estiver na página inicial (login)
    if (window.location.pathname === "/") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");
    }
}

// Criando uma instância do axios com configurações padrão
const apiClient = axios.create({
    baseURL: DIRECTUS_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para adicionar o token de autenticação em todas as requisições
apiClient.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("authToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Interceptor para tratar erros de autenticação
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se o token expirou (status 401) e não estamos tentando refresh
        if (error.response && error.response.status === 401) {
            // Limpa tokens armazenados
            if (typeof window !== "undefined") {
                localStorage.removeItem("authToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userData");

                // Redireciona para login apenas se não estiver já na página de login
                if (window.location.pathname !== "/") {
                    window.location.href = "/";
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;