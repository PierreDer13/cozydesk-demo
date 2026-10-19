import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
// Shared helper: adds the token, parses the JSON, throws { status, message } on error
import { adminFetch } from "./adminApi"

// Admin tab: list of every application, paginated, with deletion
function ApplicationsTab() {
    const navigate = useNavigate()

    // ─────────────────────────────────────────────
    // 1. STATE
    // ─────────────────────────────────────────────
    const [applications, setApplications] = useState([])
    // Every ad, used to show an ad's title instead of its id
    const [ads, setAds] = useState([])
    // Pagination: the API returns 10 applications per page
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    // ─────────────────────────────────────────────
    // 2. HELPERS
    // ─────────────────────────────────────────────
    // 401 = expired token → log in again; any other error → shown on the page
    function handleError(err) {
        if (err.status === 401) {
            navigate("/login")
        } else {
            setError(err.message)
        }
    }

    // Returns the ad's title, or #id if it can't be found
    function adTitle(id) {
        const ad = ads.find((a) => a.id === id)
        return ad ? ad.title : `#${id}`
    }

    // ─────────────────────────────────────────────
    // 3. DATA LOADING
    // ─────────────────────────────────────────────
    async function loadAds() {
        try {
            const data = await adminFetch("/ads")
            // /ads returns either an array or { items, ... } when paginated: handle both
            setAds(Array.isArray(data) ? data : (data.items ?? []))
        } catch (err) {
            handleError(err)
        }
    }

    // GET /applications?page=N → { items, page, total, total_pages }
    async function loadApplications() {
        try {
            const data = await adminFetch(`/applications?page=${page}`)
            const items = Array.isArray(data) ? data : (data.items ?? [])

            // Empty page after a deletion: go back one page
            // (changing page re-runs the useEffect below, which reloads)
            if (items.length === 0 && page > 1) {
                setPage(page - 1)
                return
            }

            setApplications(items)
            setTotalPages(data.total_pages ?? 1)
            setError("")
        } catch (err) {
            handleError(err)
        } finally {
            setIsLoading(false)
        }
    }

    // Reloads the applications every time the page changes
    useEffect(() => {
        loadApplications()
    }, [page])

    // Loads the ads only once, on first render
    useEffect(() => {
        loadAds()
    }, [])

    // ─────────────────────────────────────────────
    // 4. DELETION
    // ─────────────────────────────────────────────
    // DELETE /applications/<id> (admin only), then reload the current page
    async function handleDelete(id) {
        if (!confirm("Delete this application?")) return

        try {
            await adminFetch(`/applications/${id}`, { method: "DELETE" })
            await loadApplications()
        } catch (err) {
            handleError(err)
        }
    }

    // ─────────────────────────────────────────────
    // 5. RENDERING
    // ─────────────────────────────────────────────
    // While the first load is running
    if (isLoading) return <p>Loading...</p>

    return (
        <section>
            <h2>Applications</h2>

            {/* role="alert": screen readers announce the error */}
            {error && <p role="alert">Error: {error}</p>}

            {/* Empty state */}
            {applications.length === 0 && <p>No applications yet.</p>}

            <ul>
                {applications.map((application) => (
                    <li key={application.id}>
                        <strong>{application.name}</strong>
                        <p>Email: {application.email}</p>
                        {/* Optional fields: only shown when filled in */}
                        {application.phone && <p>Phone: {application.phone}</p>}
                        <p>Ad: {adTitle(application.ad_id)}</p>
                        {application.message && <p>Message: {application.message}</p>}
                        {/* Date formatted as day/month/year */}
                        <p>Applied: {new Date(application.applied_at).toLocaleString("en-GB")}</p>
                        <button onClick={() => handleDelete(application.id)}>Delete</button>
                    </li>
                ))}
            </ul>

            {/* Pagination: buttons disabled on the first and last page */}
            <div>
                <button onClick={() => setPage(page - 1)} disabled={page === 1}>
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                    Next
                </button>
            </div>
        </section>
    )
}

export default ApplicationsTab