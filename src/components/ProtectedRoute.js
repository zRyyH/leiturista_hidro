"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Função para verificar autenticação
        const checkAuth = () => {
            // Verifica se o usuário está autenticado
            if (!isAuthenticated()) {
                // Limpa localStorage e redireciona
                localStorage.removeItem("authToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userData");
                router.push("/");
            } else {
                setLoading(false);
            }
        };

        checkAuth();

        // Verificar periodicamente se o token continua válido
        const interval = setInterval(checkAuth, 10000); // a cada 10 segundos

        return () => clearInterval(interval);
    }, [router]);

    // Enquanto verifica a autenticação, mostra um loader ou nada
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Se está autenticado e não estamos mais carregando, renderize o conteúdo
    return <>{children}</>;
}