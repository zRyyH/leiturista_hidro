import "./globals.css";

export const metadata = {
  title: "Hidrometrização",
  description: "App de leitura de hidrômetros",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}