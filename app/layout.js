export const metadata = {
  title: 'Maratonei',
  description: 'Marque episódios e acompanhe séries com amigos',
  manifest: '/manifest.json',
  themeColor: '#FACC15'
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FACC15" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{margin: 0, background: '#0F172A'}}>
        {children}
      </body>
    </html>
  )
}
