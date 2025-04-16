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
    const router = useRouter();

    useEffect(() => {
        const userData = getCurrentUser();
        if (userData) {
            setUser(userData);
        }

        // Buscar condominios
        fetchCondominios();
    }, []);

    // Efeito para buscar leituras quando um condomínio é selecionado
    useEffect(() => {
        if (condominioSelecionado) {
            fetchLeituras();
        }
    }, [condominioSelecionado]);

    const fetchCondominios = async () => {
        try {
            const authToken = localStorage.getItem("authToken");

            const response = await axios.get(
                "https://hidro.awpsoft.com.br/items/condominios",
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
            setError(
                err.response?.data?.errors?.[0]?.message ||
                "Erro ao carregar condomínios."
            );
        }
    };

    const fetchLeituras = async () => {
        try {
            setLoading(true);

            const authToken = localStorage.getItem("authToken");

            const response = await axios.get(
                "https://hidro.awpsoft.com.br/items/leituras_unidades?fields=*,medidor_unidade_id.unidade_id.*",
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
                    leitura.status === "pendente" &&
                    leitura.medidor_unidade_id.unidade_id.condominio_id === condominioSelecionado
            );

            setLeituras(leiturasFiltradas);
            setLoading(false);
        } catch (err) {
            console.error("Erro ao buscar leituras:", err);
            setError(
                err.response?.data?.errors?.[0]?.message ||
                "Erro ao carregar leituras pendentes."
            );
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const irParaAtualizacao = (id) => {
        router.push(`/leitura/${id}`);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header simplificado e responsivo */}
                <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            {/* Logo simplificado */}
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                                </svg>
                            </div>
                            <h1 className="ml-2 text-base font-medium text-gray-800">Hidrometrização</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Avatar do usuário - apenas em telas maiores */}
                            {user && (
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-xs text-gray-600">{user.first_name || user.email}</span>
                                    <div className="h-7 w-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs">
                                        {(user.first_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                                    </div>
                                </div>
                            )}

                            {/* Botão de logout */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-red-600 rounded-md hover:bg-gray-100"
                                aria-label="Sair"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Conteúdo principal */}
                <main className="p-4">
                    {/* Seletor de condomínio */}
                    <div className="mb-4">
                        <select
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        <div className="mb-4 text-sm text-gray-600 font-medium">
                            {leituras.length} leitura{leituras.length !== 1 ? 's' : ''} pendente{leituras.length !== 1 ? 's' : ''}
                        </div>
                    )}

                    {/* Listagem de leituras pendentes - responsiva */}
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    ) : !condominioSelecionado ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm text-center">
                            Selecione um condomínio para visualizar leituras
                        </div>
                    ) : leituras.length === 0 ? (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm text-center">
                            Não há leituras pendentes para este condomínio
                        </div>
                    ) : (
                        <>
                            {/* Versão para telas grandes - tabela */}
                            <div className="hidden md:block overflow-hidden bg-white rounded-lg shadow">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                ID
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Status
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tipo
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Número
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Bloco
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                Ação
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {leituras.map((leitura) => (
                                            <tr
                                                key={leitura.id}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => irParaAtualizacao(leitura.id)}
                                            >
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {leitura.id}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                        {leitura.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {leitura.medidor_unidade_id.unidade_id.tipo_de_unidade}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {leitura.medidor_unidade_id.unidade_id.numero_da_unidade}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {leitura.medidor_unidade_id.unidade_id.bloco}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-right">
                                                    <button className="text-blue-600 hover:text-blue-900">
                                                        Ver
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Versão mobile - cards */}
                            <div className="md:hidden space-y-3">
                                {leituras.map((leitura) => (
                                    <div
                                        key={leitura.id}
                                        className="bg-white rounded-lg shadow p-3 border-l-4 border-yellow-400 cursor-pointer active:bg-gray-50"
                                        onClick={() => irParaAtualizacao(leitura.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                {leitura.status}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">
                                                ID: {leitura.id}
                                            </span>
                                        </div>
                                        <div className="mb-2">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {leitura.medidor_unidade_id.unidade_id.tipo_de_unidade} {leitura.medidor_unidade_id.unidade_id.numero_da_unidade}
                                            </h3>
                                            <p className="text-xs text-gray-600">{leitura.medidor_unidade_id.unidade_id.bloco}</p>
                                        </div>
                                        <div className="flex justify-end">
                                            <button className="text-sm text-blue-600 font-medium hover:text-blue-900">
                                                Visualizar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}