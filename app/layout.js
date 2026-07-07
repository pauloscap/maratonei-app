export const metadata = {
  title: 'Maratonei - Onde assistir',
  description: 'Descubra onde assistir suas séries favoritas',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Cola suas tags <link>, <meta>, Google Fonts aqui */}
      </head>
      <body>
        {/* Cola seu <header> aqui */}
        <header>
          <nav>Seu menu lindo aqui</nav>
        </header>

        {/* Aqui que entra o conteúdo de cada página */}
        {children}

        {/* Cola seu <footer> aqui */}
        <footer>
          <p>© 2026 Maratonei</p>
        </footer>
      </body>
    </html>
  )
}
