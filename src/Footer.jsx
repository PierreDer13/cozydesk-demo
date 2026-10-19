import "./Footer.css"
import MugLogo from "./MugLogo"
import { Link } from "react-router-dom"

// Site footer: dark band with the tagline on the left and links on the right
function Footer() {
    return (
        <footer className="footer">
            <div className="footer__brand">
                <MugLogo size={48} />
                <p className="footer__tagline">Cozy Desk · grab a coffee, find your place</p>
            </div>
            <nav className="footer__links" aria-label="Footer">
                <Link to="/about">About</Link>
                <Link to="/signup">For companies</Link>
                <a href="mailto:contact@cozydesk.example">Contact</a>
            </nav>
        </footer>
    )
}

export default Footer