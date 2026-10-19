import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getRole } from "../auth.js"


const API = "http://localhost:5000"

// Values exactly as stored in the database (same list as CreateAd)
const CONTRACT_TYPES = ["Permanent", "Fixed-term", "Apprenticeship", "Internship", "Freelance"]

// Turns an empty field into null (the API expects null, not ""), otherwise a number
function toNumberOrNull(value) {
    return value === "" || value === null ? null : Number(value)
}

// Employer page: list, edit and delete the ads of their own company only
function MyAds() {
    const [ads, setAds] = useState([])
    const [categories, setCategories] = useState([])
    // Copy of the ad being edited (null = not in edit mode)
    const [editedAd, setEditedAd] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const navigate = useNavigate()
    const role = getRole()
    // Ad whose applications are shown (null = none open)
    const [openAdId, setOpenAdId] = useState(null)
    const [applications, setApplications] = useState([])
    const [isLoadingApps, setIsLoadingApps] = useState(false)

    // Page protection: logged out → login, not an employer → home
    useEffect(() => {
        if (role === null) navigate("/login")
        else if (role !== "employer") navigate("/")
    }, [role, navigate])

    // On first render: find the employer's company, then load its ads and the categories
    useEffect(() => {
        if (role !== "employer") return
        async function loadData() {
            const token = localStorage.getItem("token")
            try {
                // GET /me gives the company the employer belongs to
                const meResponse = await fetch(`${API}/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (meResponse.status === 401) {
                    navigate("/login")
                    return
                }
                const me = await meResponse.json()

                // Only this company's ads
                const adsResponse = await fetch(`${API}/companies/${me.company_id}/ads`)
                const adsData = await adsResponse.json()
                setAds(Array.isArray(adsData) ? adsData : (adsData.items ?? []))

                const categoriesResponse = await fetch(`${API}/categories`)
                const categoriesData = await categoriesResponse.json()
                setCategories(Array.isArray(categoriesData) ? categoriesData : [])
            } catch {
                setError("We couldn't load your ads. Try again.")
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [role, navigate])

    // Updates a single field of the edited ad, keeping the others
    function handleChange(field, value) {
        setEditedAd({ ...editedAd, [field]: value })
    }

    // Saves the edits: PUT /ads/<id>
    async function handleSave(e) {
        e.preventDefault()
        if (isSubmitting) return
        setIsSubmitting(true)
        setError("")
        setSuccess("")
        const token = localStorage.getItem("token")

        try {
            const response = await fetch(`${API}/ads/${editedAd.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: editedAd.title,
                    short_description: editedAd.short_description,
                    description: editedAd.description,
                    salary_min: toNumberOrNull(editedAd.salary_min),
                    salary_max: toNumberOrNull(editedAd.salary_max),
                    place: editedAd.place || null,
                    working_time: editedAd.working_time || null,
                    contract_type: editedAd.contract_type || null,
                    company_id: editedAd.company_id,
                    category_id: Number(editedAd.category_id),
                }),
            })

            if (response.status === 401) {
                navigate("/login")
                return
            }
            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not save the ad")
                return
            }

            // Success: replace the old ad in the list and leave edit mode
            const updatedAd = await response.json()
            setAds(ads.map((ad) => (ad.id === updatedAd.id ? updatedAd : ad)))
            setEditedAd(null)
            setSuccess("Ad updated")
        } catch {
            setError("Sorry, we couldn't save your ad")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Shows or hides the applications of one ad: GET /ads/<id>/applications (owner only)
    async function toggleApplications(adId) {
        // Clicking again on the same ad closes the list
        if (openAdId === adId) {
            setOpenAdId(null)
            return
        }
        setOpenAdId(adId)
        setApplications([])
        setIsLoadingApps(true)
        setError("")
        const token = localStorage.getItem("token")

        try {
            const response = await fetch(`${API}/ads/${adId}/applications`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.status === 401) {
                navigate("/login")
                return
            }
            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not load the applications")
                return
            }
            const data = await response.json()
            // The API may return an array or { items, ... } when paginated: handle both
            setApplications(Array.isArray(data) ? data : (data.items ?? []))
        } catch {
            setError("Sorry, we couldn't load the applications")
        } finally {
            setIsLoadingApps(false)
        }
    }


    // Deletes an ad: DELETE /ads/<id> (its applications are deleted too)
    async function handleDelete(id) {
        if (!window.confirm("Delete this ad? Its applications will be deleted too.")) return
        setError("")
        setSuccess("")
        const token = localStorage.getItem("token")

        try {
            const response = await fetch(`${API}/ads/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.status === 401) {
                navigate("/login")
                return
            }
            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not delete the ad")
                return
            }
            setAds(ads.filter((ad) => ad.id !== id))
            setSuccess("Ad deleted")
        } catch {
            setError("Sorry, we couldn't delete your ad")
        }
    }

    // Shows nothing while the redirect happens
    if (role !== "employer") return null
    if (isLoading) return <p>Brewing your offers…</p>

    return (
        <section>
            <h1>My ads</h1>
            <p className="muted">Edit or remove the offers your company has posted.</p>

            {error && <p role="alert" className="message message--error">{error}</p>}
            {success && <p className="message message--success">{success}</p>}

            {/* Edit form (shown above the list while editing) */}
            {editedAd && (
                <form onSubmit={handleSave} className="card card--narrow">
                    <h2>Edit “{editedAd.title}”</h2>

                    <label htmlFor="title">Title</label>
                    <input id="title" type="text" maxLength={200} value={editedAd.title}
                        onChange={(e) => handleChange("title", e.target.value)} required />

                    <label htmlFor="short_description">Short description</label>
                    <input id="short_description" type="text" maxLength={300} value={editedAd.short_description}
                        onChange={(e) => handleChange("short_description", e.target.value)} required />

                    <label htmlFor="description">Description</label>
                    <textarea id="description" value={editedAd.description}
                        onChange={(e) => handleChange("description", e.target.value)} required />

                    {/* ?? "": a null value becomes "" so the field stays controlled */}
                    <label htmlFor="place">Place</label>
                    <input id="place" type="text" maxLength={100} value={editedAd.place ?? ""}
                        onChange={(e) => handleChange("place", e.target.value)} />

                    <label htmlFor="salary_min">Salary minimum</label>
                    <input id="salary_min" type="number" value={editedAd.salary_min ?? ""}
                        onChange={(e) => handleChange("salary_min", e.target.value)} />

                    <label htmlFor="salary_max">Salary maximum</label>
                    <input id="salary_max" type="number" value={editedAd.salary_max ?? ""}
                        onChange={(e) => handleChange("salary_max", e.target.value)} />

                    <label htmlFor="working_time">Working time</label>
                    <select id="working_time" value={editedAd.working_time ?? ""}
                        onChange={(e) => handleChange("working_time", e.target.value)}>
                        <option value="">Not specified</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                    </select>

                    <label htmlFor="contract_type">Contract type</label>
                    <select id="contract_type" value={editedAd.contract_type ?? ""}
                        onChange={(e) => handleChange("contract_type", e.target.value)}>
                        <option value="">Not specified</option>
                        {CONTRACT_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <label htmlFor="category_id">Category</label>
                    <select id="category_id" value={editedAd.category_id}
                        onChange={(e) => handleChange("category_id", e.target.value)} required>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>

                    <div className="actions">
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving…" : "Save"}
                        </button>
                        <button type="button" onClick={() => setEditedAd(null)}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Empty state */}
            {ads.length === 0 && <p className="muted">No ads posted… yet.</p>}

            {/* The company's ads */}
            <div className="card-list">
                {ads.map((ad) => (
                    <article key={ad.id} className="card">
                        <h2>{ad.title}</h2>
                        <p className="muted">{ad.place}</p>
                        <p>{ad.short_description}</p>
                        <div className="tags">
                            {ad.contract_type && <span className="tag tag--contract">{ad.contract_type}</span>}
                            {ad.working_time && <span className="tag">{ad.working_time}</span>}
                        </div>
                        <div className="actions">
                            <button type="button" onClick={() => { setEditedAd(ad); setSuccess("") }}>Edit</button>
                            <button type="button" onClick={() => handleDelete(ad.id)}>Delete</button>
                            {/* aria-expanded tells screen readers whether the list is open */}
                            <button type="button" onClick={() => toggleApplications(ad.id)}
                                aria-expanded={openAdId === ad.id}>
                                {openAdId === ad.id ? "Hide applications" : "Applications"}
                            </button>
                        </div>

                        {/* Applications received for this ad */}
                        {openAdId === ad.id && (
                            <div>
                                {isLoadingApps && <p className="muted">Brewing…</p>}
                                {!isLoadingApps && applications.length === 0 && (
                                    <p className="muted">No applications… yet.</p>
                                )}
                                {applications.map((application) => (
                                    <div key={application.id} className="card">
                                        <strong>{application.name}</strong>
                                        {/* mailto: clicking opens the mail app to answer the candidate */}
                                        <a href={`mailto:${application.email}`}>{application.email}</a>
                                        {application.phone && <p className="muted">{application.phone}</p>}
                                        {application.message && <p>{application.message}</p>}
                                        <p className="muted">
                                            Applied {new Date(application.applied_at).toLocaleString("en-GB")}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    )
}

export default MyAds