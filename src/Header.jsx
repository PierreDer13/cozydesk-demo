import MugLogo from "./MugLogo.jsx"
import { Link, useLocation, useNavigate } from "react-router-dom"

function Header() {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")
    


    function handleLogout() {
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        localStorage.removeItem("id")
        navigate("/login")
    }
let authLinks
            if (pathname === "/signup") {
                authLinks = <Link to="/login"> Already have an account? Log in</Link>
            } else if (pathname === "/login"){
                authLinks = <Link to="/signup"> Don't have an account? Sign up</Link>
            } else {
                authLinks = (
                    <>
                        <Link to="/login">Log in</Link>
                        <Link to="/signup">Sign up</Link>
                    </>
                )
            }
    return (
        <header>
            <Link to="/"><MugLogo size={36} /> Cozy Desk</Link>
            <nav>
                {!token && authLinks}
                {token && (
                    <>
                        {role === "admin" && <Link to="/adminpage">Admin</Link>}
                        {role === "employer" && <Link to="/myads">My ads</Link>}
                        {role === "employer" && <Link to="/createad"> Create an ad</Link>}
                        <Link to="/profile">My profile</Link>
                        <button type="button" onClick={handleLogout}>Log out</button>
                    </>
                )}
            </nav>
            
        </header>
    )
}
export default Header