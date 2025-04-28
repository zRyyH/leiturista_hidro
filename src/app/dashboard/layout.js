"use client";

import TokenRefresher from "@/components/TokenRefresher";
import Container from "@/components/Container";

export default function DashboardLayout({ children }) {
    return (
        <>
            <TokenRefresher />
            <div className="min-h-screen bg-gray-50">
                {/* Nota: o Container está sendo aplicado apenas ao conteúdo interno,
            não ao header, para que o header possa ter background completo */}
                {children}
            </div>
        </>
    );
}