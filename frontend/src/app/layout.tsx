// Root layout — Aplica sidebar + navbar em todas as páginas (exceto login)
// TODO: Implementar
// - Importar globals.css
// - Renderizar <Sidebar /> e <Navbar /> para rotas autenticadas
// - Não renderizar sidebar na rota /login

import "@/styles/globals.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "S.O.S Crédito — Painel de Gerência",
  description: "Sistema operacional interno — S.O.S Crédito",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 font-sans min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
