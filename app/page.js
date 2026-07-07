export default function Home() {
  return (
    <main className="main active" id="series">
      <div className="tab-header">
        <h2>Séries</h2>
        <div className="view-toggle">
          <button className="active">
            <svg viewBox="0 0 24" fill="none" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div className="grid" id="series-grade">
        <div className="poster"></div>
        <div className="poster"></div>
        <div className="poster"></div>
        <div className="poster"></div>
        <div className="poster"></div>
        <div className="poster"></div>
      </div>
    </main>
  )
}
