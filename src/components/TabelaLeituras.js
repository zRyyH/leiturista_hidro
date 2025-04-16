"use client";

import { useState } from "react";

export default function TabelaLeituras({ leituras }) {
    const [expandedRow, setExpandedRow] = useState(null);

    if (!leituras || leituras.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 mt-4">
                <div className="flex">
                    <svg className="h-5 w-5 text-yellow-600 mr-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p>Não há leituras pendentes no momento.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Unidade</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Leitura</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Data</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {leituras.map((leitura) => (
                        <>
                            <tr key={leitura.id} className={expandedRow === leitura.id ? "bg-blue-50" : ""}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    {leitura.unidade?.nome || `ID: ${leitura.unidade_id}`}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {leitura.valor_leitura ? `${leitura.valor_leitura} m³` : "Não informado"}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {new Date(leitura.date_created).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <button
                                        onClick={() => setExpandedRow(expandedRow === leitura.id ? null : leitura.id)}
                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {expandedRow === leitura.id ? "Esconder" : "Detalhes"}
                                    </button>
                                </td>
                            </tr>

                            {expandedRow === leitura.id && (
                                <tr className="bg-blue-50">
                                    <td colSpan="4" className="px-6 py-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Condomínio:</p>
                                                <p className="font-medium">{leitura.unidade?.condominio?.nome || "Não informado"}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Bloco/Andar:</p>
                                                <p className="font-medium">
                                                    {leitura.unidade?.bloco ? `Bloco ${leitura.unidade.bloco}` : ""}
                                                    {leitura.unidade?.andar ? `, Andar ${leitura.unidade.andar}` : ""}
                                                    {!leitura.unidade?.bloco && !leitura.unidade?.andar && "Não informado"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Observações:</p>
                                                <p className="font-medium">{leitura.observacoes || "Sem observações"}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Leiturista:</p>
                                                <p className="font-medium">{leitura.user_created?.first_name || "Não informado"}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex space-x-2">
                                            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                                Aprovar
                                            </button>
                                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                                Rejeitar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}