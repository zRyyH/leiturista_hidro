import axios from "axios";
import { refreshAuthToken } from "./auth";

// Obtém a URL base da API do arquivo .env
const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL;

// Criando uma instância do axios com configurações padrão
const apiClient = axios.create({
    baseURL: DIRECTUS_URL,
    headers: {
        "Content-Type": "application/json",
    },
    // Adicionar timeout para evitar requisições pendentes infinitas
    timeout: 30000 // 30 segundos
});

// Variável para controlar se uma atualização de token está em andamento
let isRefreshing = false;
// Fila de requisições que falharam com 401
let failedQueue = [];

// Processa a fila de requisições
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

// Verificar se o token JWT está próximo de expirar (5 minutos antes)
const isTokenExpiringSoon = (token) => {
    if (!token) return true;
    
    try {
        // Decodificar o payload do JWT (segunda parte do token)
        const base64Url = token.split('.')[1];
        if (!base64Url) return true;
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const { exp } = JSON.parse(jsonPayload);
        
        if (!exp) return true;
        
        // Verificar se o token expira nos próximos 5 minutos
        const currentTime = Math.floor(Date.now() / 1000);
        return exp - currentTime < 300; // 300 segundos = 5 minutos
    } catch (e) {
        console.error("Erro ao verificar expiração do token:", e);
        return true; // Em caso de erro, assume que o token precisa ser atualizado
    }
};

// Interceptor para adicionar o token de autenticação em todas as requisições
apiClient.interceptors.request.use(async (config) => {
    if (typeof window !== "undefined") {
        try {
            const token = localStorage.getItem("authToken");
            
            // Se tem token e ele está próximo de expirar, tenta atualizar proativamente
            if (token && isTokenExpiringSoon(token) && !isRefreshing && !config.url.includes('refresh')) {
                try {
                    console.log("Token próximo de expirar, atualizando proativamente...");
                    isRefreshing = true;
                    const response = await refreshAuthToken();
                    isRefreshing = false;
                    
                    // Usar o novo token para esta requisição
                    config.headers.Authorization = `Bearer ${localStorage.getItem("authToken")}`;
                } catch (refreshError) {
                    console.error("Falha ao atualizar token proativamente:", refreshError);
                    isRefreshing = false;
                    // Continua com o token atual mesmo assim
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
            } else if (token) {
                // Usar o token existente
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.error("Erro ao obter/verificar token:", e);
        }
    }
    return config;
}, error => Promise.reject(error));

// Interceptor para tratar erros de autenticação
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Armazena a requisição original
        const originalRequest = error.config;
        
        // Se o token expirou (status 401) e ainda não tentamos atualizar para esta requisição
        if (error.response && error.response.status === 401 && !originalRequest._retry && typeof window !== "undefined") {
            // Se já estamos atualizando o token, adicione esta requisição à fila
            if (isRefreshing) {
                console.log("Adicionando requisição à fila de espera por token...");
                return new Promise(function(resolve, reject) {
                    failedQueue.push({resolve, reject});
                })
                .then(token => {
                    console.log("Processando requisição da fila com novo token");
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return apiClient(originalRequest);
                })
                .catch(err => {
                    console.error("Falha ao processar requisição da fila:", err);
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("Tentando atualizar token após erro 401...");
                // Tenta atualizar o token
                const response = await refreshAuthToken();
                const { access_token } = response.data.data;
                
                console.log("Token atualizado com sucesso, retentando requisição original");
                
                // Define o novo token para esta e futuras requisições
                apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
                originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
                
                // Processa as requisições na fila com o novo token
                processQueue(null, access_token);
                
                // Retenta a requisição original com o novo token
                return apiClient(originalRequest);
            } catch (refreshError) {
                console.error("Falha definitiva ao atualizar token:", refreshError);
                // Se falhar ao atualizar o token, processa a fila com erro
                processQueue(refreshError, null);
                
                // Limpa tokens armazenados
                localStorage.removeItem("authToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userData");

                // Redireciona para login
                if (window.location.pathname !== "/") {
                    window.location.href = "/";
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;