"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Montar o componente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Limpa tokens antigos ao carregar a página
  useEffect(() => {
    if (!mounted) return;
    
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
    } catch (e) {
      console.error("Erro ao limpar armazenamento local:", e);
    }
  }, [mounted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.message ||
        "Falha na autenticação. Verifique suas credenciais."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Não renderiza nada durante SSR
  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      {/* Cabeçalho */}
      <header className="w-full p-4 bg-white border-b border-blue-100">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
            <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
          </div>
          <span className="font-medium text-xl text-blue-600">Hidrometrização</span>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 p-4 text-white">
            <h2 className="text-xl font-medium">Acesso ao Sistema</h2>
            <p className="mt-1 text-sm text-blue-100">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite sua senha"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md focus:outline-none disabled:opacity-50"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="w-full p-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          <p>Sistema de Hidrometrização para Condomínios</p>
        </div>
      </footer>
    </div>
  );
}