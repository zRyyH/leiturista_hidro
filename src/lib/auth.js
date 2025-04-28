import axios from "axios";
import apiClient from "./axios";

/**
 * Realiza o login do usuário na API Directus
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise} Promise com os dados do usuário
 */
export const login = async (email, password) => {
    try {
        // Limpa primeiro qualquer token antigo
        if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userData");
        }

        const authLoginEndpoint = process.env.NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT;
        const response = await apiClient.post(authLoginEndpoint, {
            email,
            password,
        });

        // Salva o token no localStorage
        if (response.data && response.data.data && response.data.data.access_token) {
            localStorage.setItem("authToken", response.data.data.access_token);
            localStorage.setItem("refreshToken", response.data.data.refresh_token);

            // Armazena dados do usuário como string
            try {
                localStorage.setItem("userData", JSON.stringify(response.data.data.user));
            } catch (e) {
                console.error("Erro ao armazenar dados do usuário:", e);
            }
        }

        return response.data;
    } catch (error) {
        console.error("Erro ao realizar login:", error);
        // Limpa os tokens em caso de erro
        if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userData");
        }
        throw error;
    }
};

/**
 * Realiza o logout do usuário
 */
export const logout = () => {
    if (typeof window !== "undefined") {
        try {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userData");
        } catch (e) {
            console.error("Erro ao limpar dados de autenticação:", e);
        }

        // Redireciona para a página de login
        window.location.href = "/";
    }
};

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} Verdadeiro se autenticado
 */
export const isAuthenticated = () => {
    if (typeof window === "undefined") return false;

    try {
        const token = localStorage.getItem("authToken");

        // Se não tem token, não está autenticado
        if (!token) return false;

        // Verifica se o token tem formato JWT válido (xxxx.yyyy.zzzz)
        if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
            // Remove token inválido
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userData");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        return false;
    }
};

/**
 * Obtém os dados do usuário atual
 * @returns {Object|null} Dados do usuário ou null
 */
export const getCurrentUser = () => {
    if (typeof window === "undefined") return null;

    try {
        // Verifica se o usuário está autenticado
        if (!isAuthenticated()) {
            return null;
        }

        const userData = localStorage.getItem("userData");

        // Verifica se userData é uma string válida e não a string "undefined"
        if (userData && userData !== "undefined") {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.error("Erro ao processar dados do usuário:", error);
                localStorage.removeItem("userData");
                return null;
            }
        }

        return null;
    } catch (e) {
        console.error("Erro ao obter dados do usuário:", e);
        return null;
    }
};

/**
 * Atualiza o token quando expirado usando o refresh token
 * @returns {Promise} Promise com novo token
 */
export const refreshAuthToken = async () => {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Não está no ambiente do navegador"));
    }

    try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
            return Promise.reject(new Error("Refresh token não encontrado"));
        }

        const authRefreshEndpoint = process.env.NEXT_PUBLIC_AUTH_REFRESH_ENDPOINT;
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;

        // Cria uma instância de axios sem interceptors para evitar loop infinito
        const refreshInstance = axios.create({
            baseURL: directusUrl,
            headers: {
                "Content-Type": "application/json",
            },
        });

        const response = await refreshInstance.post(authRefreshEndpoint, {
            refresh_token: refreshToken,
            mode: "json", // Garantir que a resposta seja JSON
        });

        if (response.data && response.data.data) {
            // Salva os novos tokens
            localStorage.setItem("authToken", response.data.data.access_token);
            localStorage.setItem("refreshToken", response.data.data.refresh_token);

            console.log("Token atualizado com sucesso");
            return response;
        } else {
            throw new Error("Formato de resposta inválido ao atualizar token");
        }
    } catch (error) {
        console.error("Erro ao atualizar token:", error);
        // Limpar tokens em caso de erro
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");

        // Se estiver em uma página protegida, redireciona para login
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
            window.location.href = "/";
        }

        return Promise.reject(error);
    }
};