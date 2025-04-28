"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [condominios, setCondominios] = useState([]);
    const [condominioSelecionado, setCondominioSelecionado] = useState(null);
    const [leituras, setLeituras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    // Endpoints e estados das variáveis de ambiente
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
    const condominiosEndpoint = process.env.NEXT_PUBLIC_CONDOMINIOS_ENDPOINT;
    const leiturasEndpoint = process.env.NEXT_PUBLIC_LEITURAS_UNIDADES_ENDPOINT;
    const statusPendente = process.env.NEXT_PUBLIC_STATUS_PENDENTE;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Efeito separado para executar apenas no lado do cliente
    useEffect(() => {
        if (!mounted) return;

        const userData = getCurrentUser();
        if (userData) {
            setUser(userData);
        }

        // Buscar condominios
        fetchCondominios();
    }, [mounted]);

    // Efeito para buscar leituras quando um condomínio é selecionado
    useEffect(() => {
        if (!mounted) return;

        if (condominioSelecionado) {
            fetchLeituras();
        }
    }, [condominioSelecionado, mounted]);

    const fetchCondominios = async () => {
        try {
            let authToken;
            try {
                authToken = localStorage.getItem("authToken");
            } catch (e) {
                console.error("Erro ao acessar localStorage:", e);
                return;
            }

            const response = await axios.get(
                `${directusUrl}${condominiosEndpoint}`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setCondominios(response.data.data);

            // Se houver pelo menos um condomínio, seleciona o primeiro automaticamente
            if (response.data.data && response.data.data.length > 0) {
                setCondominioSelecionado(response.data.data[0].id);
            }
        } catch (err) {
            console.error("Erro ao buscar condomínios:", err);
            setError("Erro ao carregar condomínios.");
        }
    };

    const fetchLeituras = async () => {
        try {
            setLoading(true);

            let authToken;
            try {
                authToken = localStorage.getItem("authToken");
            } catch (e) {
                console.error("Erro ao acessar localStorage:", e);
                setLoading(false);
                return;
            }

            const response = await axios.get(
                `${directusUrl}${leiturasEndpoint}?fields=*,medidor_unidade_id.unidade_id.*,medidor_unidade_id.*`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Filtra apenas as leituras com status "pendente" e do condomínio selecionado
            const leiturasFiltradas = response.data.data.filter(
                (leitura) =>
                    leitura.status === statusPendente &&
                    leitura.medidor_unidade_id.unidade_id.condominio_id === condominioSelecionado
            );

            setLeituras(leiturasFiltradas);
            setLoading(false);
        } catch (err) {
            console.error("Erro ao buscar leituras:", err);
            setError("Erro ao carregar leituras pendentes.");
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const irParaAtualizacao = (id) => {
        router.push(`/leitura/${id}`);
    };

    // Formatar data no padrão brasileiro
    const formatarData = (dataISO) => {
        if (!dataISO) return "Data não disponível";

        try {
            const data = new Date(dataISO);
            return data.toLocaleDateString('pt-BR');
        } catch (e) {
            return "Data inválida";
        }
    };

    // Não renderiza nada durante SSR
    if (!mounted) return null;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header simplificado */}
                <header className="bg-white shadow-sm px-3 py-2">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <div className="text-base font-medium">Hidrometrização</div>
                        <button
                            onClick={handleLogout}
                            className="text-red-600"
                        >
                            Sair
                        </button>
                    </div>
                </header>

                {/* Conteúdo principal */}
                <main className="p-3">
                    <div className="max-w-4xl mx-auto">
                        {/* Seletor de condomínio */}
                        <div className="mb-3">
                            <select
                                className="w-full border border-gray-300 bg-white p-2 rounded"
                                value={condominioSelecionado || ""}
                                onChange={(e) => setCondominioSelecionado(Number(e.target.value))}
                            >
                                <option value="" disabled>Selecione um condomínio</option>
                                {condominios.map((condominio) => (
                                    <option key={condominio.id} value={condominio.id}>
                                        {condominio.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Contador de leituras */}
                        {!loading && !error && condominioSelecionado && (
                            <div className="mb-3 text-sm text-gray-600">
                                {leituras.length} leitura{leituras.length !== 1 ? 's' : ''} pendente{leituras.length !== 1 ? 's' : ''}
                            </div>
                        )}

                        {/* Listagem de leituras pendentes */}
                        {loading ? (
                            <div className="flex justify-center items-center p-4">
                                Carregando...
                            </div>
                        ) : error ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                                {error}
                            </div>
                        ) : !condominioSelecionado ? (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-600 text-sm text-center">
                                Selecione um condomínio para visualizar leituras
                            </div>
                        ) : leituras.length === 0 ? (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-600 text-sm text-center">
                                Não há leituras pendentes para este condomínio
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {leituras.map((leitura) => (
                                    <div
                                        key={leitura.id}
                                        className="bg-white p-3 border border-gray-200 rounded cursor-pointer"
                                        onClick={() => irParaAtualizacao(leitura.id)}
                                    >
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium">
                                                {leitura.medidor_unidade_id.unidade_id.tipo_de_unidade} {leitura.medidor_unidade_id.unidade_id.numero_da_unidade}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                                {leitura.status}
                                            </span>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
                                            <div>
                                                <span className="font-medium">Bloco:</span> {leitura.medidor_unidade_id.unidade_id.bloco || "N/A"}
                                            </div>
                                            <div>
                                                <span className="font-medium">Medidor:</span> {leitura.medidor_unidade_id.codigo_do_medidor || "N/A"}
                                            </div>
                                            <div>
                                                <span className="font-medium">Data da leitura:</span> {formatarData(leitura.data_da_leitura)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Próxima Leitura:</span> {formatarData(leitura.data_da_proxima_leitura)}
                                            </div>
                                        </div>
                                        {leitura.leitura && (
                                            <div className="mt-1 text-xs text-gray-600 border-t pt-1 border-gray-100">
                                                <span className="font-medium">Última leitura:</span> {leitura.leitura} m³
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}