import "./globals.css";

export const metadata = {
  title: "FichaPronta",
  description: "Ficha de anamnese online para fisioterapeutas e massoterapeutas",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
