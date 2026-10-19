import "./Screen.css"

function Screen({ title = "featured_offers.exe", children }) {
  return (
    <div className="screen-wrap">
      <div className="screen">
        <div className="screen-bar">
          <span>{title}</span>
        </div>
        <div className="screen-body">
          {children}
        </div>
        <div className="screen-foot">
          <span className="screen-label">CD-86</span>
          <span className="screen-led"></span>
        </div>
      </div>
      <div className="screen-stand"></div>
    </div>
  )
}

export default Screen