"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AtualizarLeitura() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();
    const [leitura, setLeitura] = useState(null);
    const [valorLeitura, setValorLeitura] = useState("");
    const [observacao, setObservacao] = useState("");
    const [foto, setFoto] = useState(null);
    const [previewFoto, setPreviewFoto] = useState("");
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef(null);

    // Endpoints e estados das variáveis de ambiente
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
    const leiturasEndpoint = process.env.NEXT_PUBLIC_LEITURAS_UNIDADES_ENDPOINT;
    const filesEndpoint = process.env.NEXT_PUBLIC_FILES_ENDPOINT;
    const statusAnalise = process.env.NEXT_PUBLIC_STATUS_ANALISE;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Busca os dados da leitura atual
    useEffect(() => {
        if (!mounted) return;

        const fetchLeitura = async () => {
            try {
                let authToken;
                try {
                    authToken = localStorage.getItem("authToken");
                } catch (e) {
                    console.error("Erro ao acessar localStorage:", e);
                    setLoading(false);
                    return;
                }

                const response = await axios.get(
                    `${directusUrl}${leiturasEndpoint}/${id}?fields=*,medidor_unidade_id.unidade_id.*,medidor_unidade_id.*`,
                    {
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                setLeitura(response.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar leitura:", err);
                setError("Erro ao carregar dados da leitura.");
                setLoading(false);
            }
        };

        if (id) {
            fetchLeitura();
        }
    }, [id, mounted, directusUrl, leiturasEndpoint]);

    // Manipula a seleção de arquivo
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFoto(file);

            // Cria uma URL para preview da imagem
            const previewUrl = URL.createObjectURL(file);
            setPreviewFoto(previewUrl);
        }
    };

    // Função para remover a foto selecionada
    const handleRemoveFoto = () => {
        setFoto(null);
        setPreviewFoto("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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

    // Manipula o envio do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);

        try {
            // Verifica se temos a leitura e a foto
            if (!valorLeitura) {
                throw new Error("Informe o valor da leitura.");
            }

            if (!foto) {
                throw new Error("É necessário enviar uma foto do medidor.");
            }

            // Obtém o token de autenticação
            let authToken;
            try {
                authToken = localStorage.getItem("authToken");
            } catch (e) {
                console.error("Erro ao acessar localStorage:", e);
                throw new Error("Erro de autenticação. Tente fazer login novamente.");
            }

            // Faz upload da foto
            const formData = new FormData();
            formData.append("file", foto);

            const fotoResponse = await axios.post(
                `${directusUrl}${filesEndpoint}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const fotoId = fotoResponse.data.data.id;

            // Dados para atualizar a leitura
            const dadosAtualizados = {
                leitura: parseInt(valorLeitura),
                foto_id: fotoId,
                status: statusAnalise,
                data_leitura: new Date().toISOString(), // Data atual da leitura
            };

            // Adiciona observação se foi fornecida
            if (observacao.trim()) {
                dadosAtualizados.observacoes = observacao.trim();
            }

            // Atualiza a leitura com o ID da foto
            await axios.patch(
                `${directusUrl}${leiturasEndpoint}/${id}`,
                dadosAtualizados,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setSuccess(true);
            // Redireciona após 1.5 segundos
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (err) {
            setError(err.message || "Erro ao atualizar leitura.");
        } finally {
            setEnviando(false);
        }
    };

    // Calcular consumo se houver leitura anterior
    const calcularConsumo = () => {
        if (!leitura || !leitura.leitura || !valorLeitura) return null;

        const leituraAtual = parseInt(valorLeitura);
        const leituraAnterior = parseInt(leitura.leitura);

        return leituraAtual - leituraAnterior;
    };

    const consumo = calcularConsumo();

    // Não renderiza nada durante SSR
    if (!mounted) return null;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header simplificado */}
                <header className="bg-white shadow-sm px-3 py-2">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="text-gray-800"
                        >
                            Voltar
                        </button>
                        <span className="text-base font-medium">Atualizar Leitura</span>
                        <div></div>
                    </div>
                </header>

                {/* Conteúdo principal */}
                <main className="p-3">
                    <div className="max-w-4xl mx-auto">
                        {loading ? (
                            <div className="flex justify-center items-center p-4">
                                Carregando...
                            </div>
                        ) : error && !leitura ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                                {error}
                            </div>
                        ) : !leitura ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                                Leitura não encontrada
                            </div>
                        ) : (
                            <div className="bg-white rounded border border-gray-200 p-3">
                                {success ? (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
                                        Leitura atualizada com sucesso!
                                    </div>
                                ) : (
                                    <>
                                        {/* Informações detalhadas */}
                                        <div className="mb-4 pb-3 border-b border-gray-100">
                                            <h3 className="text-base font-medium mb-2">
                                                {leitura.medidor_unidade_id.unidade_id.tipo_de_unidade} {leitura.medidor_unidade_id.unidade_id.numero_da_unidade}
                                            </h3>

                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Bloco:</span>{" "}
                                                    <span className="font-medium">{leitura.medidor_unidade_id.unidade_id.bloco || "N/A"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Medidor:</span>{" "}
                                                    <span className="font-medium">{leitura.medidor_unidade_id.codigo_do_medidor || "N/A"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Última leitura:</span>{" "}
                                                    <span className="font-medium">{leitura.leitura || "0"} m³</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Data da leitura:</span> {formatarData(leitura.data_da_leitura)}
                                                </div>
                                                {leitura.data_da_proxima_leitura && (
                                                    <div className="col-span-2">
                                                        <span className="text-gray-600">Próxima leitura:</span>{" "}
                                                        <span className="font-medium">{formatarData(leitura.data_da_proxima_leitura)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Formulário */}
                                        <form onSubmit={handleSubmit}>
                                            {error && (
                                                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                                                    {error}
                                                </div>
                                            )}

                                            {/* Input de leitura */}
                                            <div className="mb-3">
                                                <label htmlFor="leitura" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Leitura atual do medidor (m³)
                                                </label>
                                                <input
                                                    type="number"
                                                    id="leitura"
                                                    value={valorLeitura}
                                                    onChange={(e) => setValorLeitura(e.target.value)}
                                                    className="w-full rounded border border-gray-300 p-2"
                                                    placeholder="Digite o valor"
                                                    required
                                                />
                                            </div>

                                            {/* Exibição do consumo calculado */}
                                            {consumo !== null && (
                                                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                                    <p className="text-sm text-blue-700">
                                                        <span className="font-medium">Consumo calculado:</span> {consumo} m³
                                                    </p>
                                                </div>
                                            )}

                                            {/* Campo de observações */}
                                            <div className="mb-3">
                                                <label htmlFor="observacao" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Observações (opcional)
                                                </label>
                                                <textarea
                                                    id="observacao"
                                                    rows="2"
                                                    value={observacao}
                                                    onChange={(e) => setObservacao(e.target.value)}
                                                    className="w-full rounded border border-gray-300 p-2"
                                                    placeholder="Observações sobre a leitura"
                                                ></textarea>
                                            </div>

                                            {/* Upload de foto */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Foto do medidor
                                                </label>

                                                {previewFoto ? (
                                                    <div className="relative">
                                                        <img
                                                            src={previewFoto}
                                                            alt="Preview"
                                                            className="w-full h-40 object-cover rounded border border-gray-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveFoto}
                                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                                                        >
                                                            X
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="p-3 border border-gray-300 border-dashed rounded text-center cursor-pointer"
                                                    >
                                                        <p className="text-sm text-gray-600">Clique para selecionar foto</p>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            ref={fileInputRef}
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Botão de envio */}
                                            <div className="mt-4">
                                                <button
                                                    type="submit"
                                                    disabled={enviando}
                                                    className="w-full py-2 px-4 border border-transparent rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {enviando ? "Enviando..." : "Confirmar leitura"}
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}