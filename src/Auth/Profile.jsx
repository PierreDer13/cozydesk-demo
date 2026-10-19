import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Profile() {
    const [first_name, setFirst_name] = useState("")
    const [last_name, setLast_name] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState(null)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        async function loadProfile() {
            const token = localStorage.getItem("token")
            if (!token) {
                navigate("/login")
                return
            }

            try {
                const response = await fetch("http://localhost:5000/me", {
                    headers: { Authorization: `Bearer ${token}` },
                })

                if (response.status === 401) {
                    navigate("/login")
                    return
                }
                if (!response.ok) {
                    setError("Could not load your profile")
                    return
                }

                const data = await response.json()
                setFirst_name(data.first_name ?? "")
                setLast_name(data.last_name ?? "")
                setEmail(data.email ?? "")
                setPhone(data.phone ?? "")
            } catch {
                setError("Could not load your profile")
            } finally {
                setIsLoading(false)
            }
        }

        loadProfile()
    }, [navigate])

    async function handleSubmit(e) {
        e.preventDefault()
        if (isSubmitting) return
        setIsSubmitting(true)
        setError("")
        setSuccess("")

        try {
            const token = localStorage.getItem("token")
            if (!token) {
                navigate("/login")
                return
            }

            const response = await fetch("http://localhost:5000/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email,
                    first_name,
                    last_name,
                    phone,
                }),
            })

            if (response.status === 401) {
                navigate("/login")
                return
            }
            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not update your profile")
                return
            }

            const data = await response.json()
            setFirst_name(data.first_name ?? "")
            setLast_name(data.last_name ?? "")
            setEmail(data.email ?? "")
            setPhone(data.phone ?? "")
            setSuccess("Profile updated")
        } catch {
            setError("Could not update your profile")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <p>Loading...</p>

    return (
    <section className="card card--narrow">
        <h1>My profile</h1>
        <p className="muted">Your details are filled in automatically when you apply.</p>

        <form onSubmit={handleSubmit}>
            <label htmlFor="first_name">First name</label>
            <input id="first_name" value={first_name} type="text"
                onChange={(e) => setFirst_name(e.target.value)} required />

            <label htmlFor="last_name">Last name</label>
            <input id="last_name" value={last_name} type="text"
                onChange={(e) => setLast_name(e.target.value)} required />

            <label htmlFor="email">Email</label>
            <input id="email" value={email} type="email"
                onChange={(e) => setEmail(e.target.value)} readOnly />

            <label htmlFor="phone">Phone</label>
            <input id="phone" value={phone} type="tel"
                onChange={(e) => setPhone(e.target.value)} />

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
            </button>
            {error && <p className="message message--error">{error}</p>}
            {success && <p className="message message--success">{success}</p>}
        </form>
    </section>
    )
}

export default Profile