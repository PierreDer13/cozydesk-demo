import MugLogo from "./MugLogo.jsx"
import "./SteamingMug.css"

function SteamingMug({ size = 120 }) {
  return (
    <div className="steaming-mug">
      <div className="steam">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <MugLogo size={size} />
    </div>
  )
}

export default SteamingMug