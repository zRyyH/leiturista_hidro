"use client";

import { useEffect, useState } from 'react';
import { refreshAuthToken, isAuthenticated } from '@/lib/auth';

/**
 * Componente que atualiza o token automaticamente em intervalos regulares
 * para manter a sessão ativa mesmo após longos períodos
 */
export default function TokenRefresher() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Não executa nada durante o SSR
        if (!mounted) return;

        // Função para atualizar token
        const refreshToken = async () => {
            // Verifica se o usuário está autenticado antes de tentar atualizar
            if (!isAuthenticated()) return;

            try {
                await refreshAuthToken();
                console.log("Token atualizado automaticamente");
            } catch (error) {
                console.error("Falha na atualização automática do token:", error);
            }
        };

        // Atualizar token ao montar o componente
        refreshToken();

        // Configurar intervalo para atualizar o token
        // Definindo para 14 minutos (840000ms) considerando que os tokens costumam
        // expirar em 15 minutos, e deixando uma margem de segurança
        const intervalId = setInterval(refreshToken, 840000);

        // Limpar intervalo ao desmontar
        return () => {
            clearInterval(intervalId);
        };
    }, [mounted]);

    // Este componente não renderiza nada visualmente
    return null;
}