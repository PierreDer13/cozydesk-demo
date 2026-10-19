import SteamingMug from "./SteamingMug.jsx"
import "./Loader.css"

function Loader({ text = "Brewing your offers…", size = 120 }) {
  return (
    <div className="loader">
      <SteamingMug size={size} />
      <p className="loader-text">{text}</p>
    </div>
  )
}

export default Loader