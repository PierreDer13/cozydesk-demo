import Screen from './Screen.jsx'
import SteamingMug from './SteamingMug.jsx'
import Loader from './Loader.jsx'
import { useState, useEffect, useRef } from 'react'
import './App.css'
import ApplyBlock from './ApplyBlock.jsx'

function App() {
  const [ads, setAds] = useState([])
  const [selectedAd, setSelectedAd] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const screenRef = useRef(null)

  function openAd(ad) {
    setSelectedAd(ad)
    screenRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  useEffect(() => {
    fetch(`http://localhost:5000/ads?page=${page}`)
      .then((response) => response.json())
      .then((data) => {
        setAds(data.items)
        setTotalPages(data.total_pages)
      })
  }, [page])

  return (
    <div>
      <section className="hero hero--split">
          <div className="hero-text">
              <div className="hero-title">
                  <SteamingMug size={96} />
                  <h1>Find your dream job before your coffee gets cold.</h1>
              </div>
              <p className="muted">Cozy Desk connects people with companies building a greener future. Grab a coffee, browse offers, and apply in a few clicks.</p>
          </div>
          <div className="hero-screen" ref={screenRef}>
              <Screen key={selectedAd ? selectedAd.id : "empty"} title="featured_offers.exe">
                  {selectedAd ? (
                      <>
                          <h2>{selectedAd.title}</h2>
                          <p className="muted">{selectedAd.company_name} · {selectedAd.place}</p>
                          {selectedAd.salary_min && selectedAd.salary_max && (
                              <p>{selectedAd.salary_min} - {selectedAd.salary_max} €</p>
                          )}
                          <p>{selectedAd.description}</p>
                          <div className="tags">
                              <span className="tag tag--contract">{selectedAd.contract_type}</span>
                              <span className="tag">{selectedAd.working_time}</span>
                          </div>
                          <div className="screen-actions">
                              <ApplyBlock key={selectedAd.id} adId={selectedAd.id} />
                              <button onClick={() => setSelectedAd(null)}>Close</button>
                          </div>
                      </>
                  ) : (
                      <Loader size={64} text="Brewing your offers… pick one below ☕" />
                  )}
              </Screen>
          </div>
      </section>

      <div className="card-list">
        {ads.map((ad) => (
          <div key={ad.id} className="card">
            <h2>{ad.title}</h2>
            <p className="muted">{ad.company_name} · {ad.place}</p>
            <p>{ad.short_description}</p>
            <div className="tags">
              <span className="tag tag--contract">{ad.contract_type}</span>
              <span className="tag">{ad.working_time}</span>
            </div>
            <div className="actions">
              <button onClick={() => openAd(ad)}>Learn more</button>
              <button onClick={() => openAd(ad)}>Apply</button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="actions">
          <button type="button" onClick={() => { setPage(page - 1); setSelectedAd(null) }} disabled={page === 1}>
            Previous
          </button>
          <span className="muted">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => { setPage(page + 1); setSelectedAd(null) }} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default App