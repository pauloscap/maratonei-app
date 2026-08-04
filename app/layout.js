export const metadata = {
  title: 'Maratonei',
  description: 'Marque episódios e acompanhe séries com amigos',
  manifest: '/manifest.json',
  themeColor: '#FACC15'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FACC15" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{margin: 0, background: '#0A0F2A', overflowX: 'hidden'}}>
        {children}
      </body>
    </html>
  )
}
