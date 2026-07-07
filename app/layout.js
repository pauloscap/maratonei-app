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

// NOVO: themeColor agora fica aqui
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
            <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..." alt="Logo" />
            <span>Maratonei</span>
          </div>
          <svg className="bell" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M18 8A6 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 1-3.46 0"></path>
          </svg>
        </header>

        {children}

        <nav className="bottom-nav">
          <div className="nav-item active" data-tab="series">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <span>Séries</span>
          </div>
          <div className="nav-item inactive" data-tab="filmes">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <span>Filmes</span>
          </div>
          <div className="nav-item inactive" data-tab="localizar">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span>Localizar</span>
          </div>
          <div className="nav-item inactive" data-tab="agenda">
            <svg viewBox="0 0 24" fill="none" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Agenda</span>
          </div>
          <div className="nav-item inactive" data-tab="perfil">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M20 21v-2a4 0 0 0-4-4H8a4 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Perfil</span>
          </div>
        </nav>
      </body>
    </html>
  )
}
