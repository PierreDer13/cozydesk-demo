import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { getRole } from "./auth"

const API = "http://localhost:5000"

// Application form shown inside a job ad (adId = the ad being applied to)
// - visitor (logged out): fills in name, email, phone and message, sent without a token
// - logged-in user: only writes a message, their details come from their account
function ApplyBlock({ adId }) {
    const [message, setMessage] = useState("")
    // Visitor-only fields
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    // Prevents double submissions while the request is in progress
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate()
    // "user", "employer", "admin", or null when logged out
    const role = getRole()
    const isVisitor = role === null

    async function handleSubmit(e) {
        e.preventDefault() // stop the browser from reloading the page
        if (isSubmitting) return
        setError("")
        setIsSubmitting(true)

        // Visitor: no token, details typed in the form
        // Logged-in user: token in the header, details taken from the account by the API
        const token = localStorage.getItem("token")
        const headers = { "Content-Type": "application/json" }
        if (!isVisitor) headers.Authorization = `Bearer ${token}`

        const body = isVisitor
            ? {
                applicant_name: name.trim(),
                applicant_email: email.trim(),
                applicant_phone: phone.trim() || null,
                message,
            }
            : { message }

        try {
            // POST /ads/<id>/applications (open to visitors and users)
            const response = await fetch(`${API}/ads/${adId}/applications`, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            })

            // 401 = expired token for a logged-in user: log in again
            if (response.status === 401 && !isVisitor) {
                navigate("/login")
                return
            }
            // Other API errors return { "error": "..." }: show that text
            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not apply")
                return
            }
            setSuccess(true)
        }
        catch {
            // Network error (API stopped, wrong port…)
            setError("Sorry, we could not send your application")
        }
        finally {
            // Runs in every case, even after a return: re-enables the button
            setIsSubmitting(false)
        }
    }

    // Employers and admins can't apply: show nothing
    if (!isVisitor && role !== "user") {
        return null
    }
    // After a successful send: success message (mint, design system class)
    if (success) {
        return <p className="message message--success">Application sent. Fingers crossed!</p>
    }

    return (
        <form onSubmit={handleSubmit}>
            {/* Visitor only: contact details (a logged-in user already has them in their account) */}
            {isVisitor && (
                <>
                    <label htmlFor="applicant_name">Full name</label>
                    <input id="applicant_name" type="text" maxLength={200} value={name}
                        onChange={(e) => setName(e.target.value)} required />

                    <label htmlFor="applicant_email">Email</label>
                    <input id="applicant_email" type="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} required />

                    <label htmlFor="applicant_phone">Phone (optional)</label>
                    <input id="applicant_phone" type="tel" value={phone}
                        onChange={(e) => setPhone(e.target.value)} />
                </>
            )}

            {/* htmlFor links the label to the textarea (accessibility) */}
            <label htmlFor="message">Tell the company why you are a good fit</label>
            <textarea id="message" maxLength={1200} value={message}
                onChange={(e) => setMessage(e.target.value)} />

            {/* Error message (terracotta), read aloud by screen readers via role="alert" */}
            {error && <p role="alert" className="message message--error">{error}</p>}

            {/* Disabled while sending; the cozy text matches the Loader */}
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Brewing..." : "Apply"}
            </button>
        </form>
    )
}

export default ApplyBlock