"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Função para verificar autenticação de forma segura (apenas no cliente)
        const checkAuth = () => {
            try {
                const token = localStorage.getItem("authToken");
                if (!token) {
                    // Limpa localStorage e redireciona
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("userData");
                    router.push("/");
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Erro ao verificar autenticação:", err);
                router.push("/");
            }
        };

        // Executa apenas no cliente
        if (mounted) {
            checkAuth();
        }
    }, [router, mounted]);

    // Não renderiza nada durante SSR ou antes de montar no cliente
    if (!mounted) return null;

    // Enquanto verifica a autenticação, mostra um loader
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Carregando...
            </div>
        );
    }

    // Se está autenticado e não estamos mais carregando, renderize o conteúdo
    return <>{children}</>;
}