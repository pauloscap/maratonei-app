import './globals.css'

export const metadata = {
  title: 'Maratonei v1.0',
  description: 'App de check-in de séries e filmes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Maratonei',
  },
}

export const viewport = {
  themeColor: '#FACC15',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body>
        <header className="header">
          <div className="logo-container">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Logo" />
            <span>Maratonei</span>
          </div>
          <svg className="bell" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M18 8A6 0 6 8c0 7-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 1-3.46 0"></path>
          </svg>
        </header>
        {children}
      </body>
    </html>
  )
}
