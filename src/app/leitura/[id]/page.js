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
    const [foto, setFoto] = useState(null);
    const [previewFoto, setPreviewFoto] = useState("");
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    // Busca os dados da leitura atual
    useEffect(() => {
        const fetchLeitura = async () => {
            try {
                const authToken = localStorage.getItem("authToken");

                const response = await axios.get(
                    `https://hidro.awpsoft.com.br/items/leituras_unidades/${id}?fields=*,medidor_unidade_id.unidade_id.*`,
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
                setError(
                    err.response?.data?.errors?.[0]?.message ||
                    "Erro ao carregar dados da leitura."
                );
                setLoading(false);
            }
        };

        if (id) {
            fetchLeitura();
        }
    }, [id]);

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

    // Função para fazer upload da foto
    const uploadFoto = async () => {
        if (!foto) return null;

        try {
            const authToken = localStorage.getItem("authToken");

            const formData = new FormData();
            formData.append("file", foto);

            const response = await axios.post(
                "https://hidro.awpsoft.com.br/files",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            return response.data.data.id;
        } catch (err) {
            console.error("Erro ao fazer upload da foto:", err);
            throw new Error(
                err.response?.data?.errors?.[0]?.message ||
                "Erro ao fazer upload da foto."
            );
        }
    };

    // Função para atualizar a leitura
    const atualizarLeitura = async (fotoId) => {
        try {
            const authToken = localStorage.getItem("authToken");

            const dadosAtualizados = {
                leitura: parseInt(valorLeitura),
                foto_id: fotoId,
                status: "concluido"
            };

            console.log("Dados atualizados:", dadosAtualizados);

            await axios.patch(
                `https://hidro.awpsoft.com.br/items/leituras_unidades/${id}`,
                dadosAtualizados,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return true;
        } catch (err) {
            console.error("Erro ao atualizar leitura:", err);
            throw new Error(
                err.response?.data?.errors?.[0]?.message ||
                "Erro ao atualizar leitura."
            );
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

            // Faz upload da foto
            const fotoId = await uploadFoto();

            if (!fotoId) {
                throw new Error("Erro ao processar a foto. Tente novamente.");
            }

            // Atualiza a leitura com o ID da foto
            const atualizado = await atualizarLeitura(fotoId);

            if (atualizado) {
                setSuccess(true);
                // Redireciona após 2 segundos
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header simplificado e responsivo */}
                <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex items-center text-gray-800"
                        >
                            <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            <span className="text-sm font-medium">Voltar</span>
                        </button>

                        <h1 className="text-base font-medium text-gray-800">Atualizar Leitura</h1>

                        <div className="w-5"></div> {/* Espaçador para manter o título centralizado */}
                    </div>
                </header>

                {/* Conteúdo principal */}
                <main className="p-4 max-w-md mx-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error && !leitura ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    ) : !leitura ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            Leitura não encontrada
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-4">
                            {success ? (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center">
                                        <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <p className="text-green-700 font-medium">Leitura atualizada com sucesso!</p>
                                    </div>
                                    <p className="mt-2 text-sm text-green-600">Redirecionando para o dashboard...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Informações da leitura */}
                                    <div className="mb-4 pb-4 border-b border-gray-100">
                                        <h2 className="text-sm font-medium text-gray-500 mb-1">Informações da unidade</h2>
                                        <div className="flex justify-between">
                                            <p className="text-base font-medium">
                                                {leitura.medidor_unidade_id.unidade_id.tipo_de_unidade} {leitura.medidor_unidade_id.unidade_id.numero_da_unidade}
                                            </p>
                                            <p className="text-base font-medium">
                                                {leitura.medidor_unidade_id.unidade_id.bloco}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Formulário de atualização */}
                                    <form onSubmit={handleSubmit}>
                                        {error && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                                {error}
                                            </div>
                                        )}

                                        {/* Input para leitura do medidor */}
                                        <div className="mb-4">
                                            <label htmlFor="leitura" className="block text-sm font-medium text-gray-700 mb-1">
                                                Leitura do medidor (m³)
                                            </label>
                                            <input
                                                type="number"
                                                id="leitura"
                                                value={valorLeitura}
                                                onChange={(e) => setValorLeitura(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Digite o valor da leitura"
                                                required
                                            />
                                        </div>

                                        {/* Upload de foto */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Foto do medidor
                                            </label>

                                            {previewFoto ? (
                                                <div className="mt-2 relative">
                                                    <img
                                                        src={previewFoto}
                                                        alt="Preview"
                                                        className="w-full h-48 object-cover rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveFoto}
                                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current.click()}
                                                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-500"
                                                >
                                                    <div className="space-y-1 text-center">
                                                        <svg
                                                            className="mx-auto h-12 w-12 text-gray-400"
                                                            stroke="currentColor"
                                                            fill="none"
                                                            viewBox="0 0 48 48"
                                                        >
                                                            <path
                                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                        <div className="flex text-sm text-gray-600">
                                                            <label
                                                                htmlFor="file-upload"
                                                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                                            >
                                                                <span>Carregar arquivo</span>
                                                                <input
                                                                    id="file-upload"
                                                                    name="file-upload"
                                                                    type="file"
                                                                    className="sr-only"
                                                                    ref={fileInputRef}
                                                                    accept="image/*"
                                                                    onChange={handleFileChange}
                                                                />
                                                            </label>
                                                            <p className="pl-1">ou arraste e solte</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">PNG, JPG, JPEG até 10MB</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botão de envio */}
                                        <button
                                            type="submit"
                                            disabled={enviando}
                                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            {enviando ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                                    Enviando...
                                                </>
                                            ) : (
                                                "Confirmar leitura"
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}