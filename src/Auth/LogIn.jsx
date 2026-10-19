import { useNavigate } from "react-router-dom"
import { useState } from "react"

// Login page: sends email + password, stores the token, redirects according to the role
function LogIn() {
    // Controlled fields: each value lives in the state
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault() // stop the page from reloading

        // POST /auth/login → { id, role, token } when the credentials are right
        const reponse = await fetch("http://localhost:5000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })

        // Wrong credentials: generic message (we don't say which field is wrong, for security)
        if (!reponse.ok) {
            setError("email or password incorrect")
            return
        }
        const data = await reponse.json()

        // Keep the session in the browser (read again by getRole and the fetch calls)
        localStorage.setItem("id", data.id)
        localStorage.setItem("role", data.role)
        localStorage.setItem("token", data.token)

        // Redirect according to the role
        if (data.role === "admin") {
            navigate("/adminpage")      // admin → dashboard
        }
        else if (data.role === "employer") {
            navigate("/createad")       // company → create an ad
        }
        else {
            navigate("/")               // user → job ads list
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                {/* htmlFor links each label to its field (accessibility) */}
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="password">Password</label>
                {/* type="password": hides the characters */}
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p>{error}</p>}
                <button type="submit">Log in</button>
            </form>
        </div>
    )
}

export default LogIn