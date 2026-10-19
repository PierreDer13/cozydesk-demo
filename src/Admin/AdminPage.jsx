import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getRole } from "../auth"

// Base URL of Chase's Flask API
const API = "http://localhost:5000"
// Admin tabs, in display order
const TABS = ["Ads", "People", "Applications", "Companies", "Categories"]

// Each tab (except Ads) is its own component in the Admin/ folder
import CategoriesTab from "./CategoriesTab"
import CompaniesTab from "./CompaniesTab"
import PeopleTab from "./PeopleTab"
import ApplicationsTab from "./ApplicationsTab"

// Turns an empty field into null (the API expects null, not ""), otherwise a number
function toNumberOrNull(value) {
    return value === "" || value === null ? null : Number(value)
}

function AdminPage() {
    // Data loaded from the API
    const [ads, setAds] = useState([])
    const [companies, setCompanies] = useState([])
    const [categories, setCategories] = useState([])
    // Ad shown in detail (read-only)
    const [selectedAd, setSelectedAd] = useState(null)
    // Copy of the ad being edited (null = not in edit mode)
    const [editedAd, setEditedAd] = useState(null)
    const [error, setError] = useState("")
    // Currently open tab
    const [tab, setTab] = useState("Ads")
    const navigate = useNavigate()
    // "user", "employer", "admin", or null when logged out
    const role = getRole()

    // On first render: load ads, companies and categories (admins only)
    useEffect(() => {
        if (role !== "admin") return
        fetch(`${API}/ads`)
            .then((response) => response.json())
            .then((data) => setAds(data))
        fetch(`${API}/companies`)
            .then((response) => response.json())
            .then((data) => setCompanies(data))
        fetch(`${API}/categories`)
            .then((response) => response.json())
            .then((data) => setCategories(data))
    }, [])

    // Finds a company's name from its id (shows "#id" if not found)
    function companyName(id) {
        const company = companies.find((c) => c.id === id)
        return company ? company.name : `#${id}`
    }

    // Same thing for categories
    function categoryName(id) {
        const category = categories.find((c) => c.id === id)
        return category ? category.name : `#${id}`
    }

    // Updates a single field of the edited ad, keeping the others
    function handleChange(field, value) {
        setEditedAd({ ...editedAd, [field]: value })
    }

    // Opens an ad's details and leaves edit mode
    function selectAd(ad) {
        setSelectedAd(ad)
        setEditedAd(null)
        setError("")
    }

    // Saves the edits: PUT /ads/<id>
    async function handleSave(e) {
        e.preventDefault() // stop the page from reloading
        setError("")
        const token = localStorage.getItem("token")

        // Body sent to the API: empty fields become null, ids become numbers
        const body = {
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
        }

        const response = await fetch(`${API}/ads/${editedAd.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        })

        // 401 = expired token: log in again
        if (response.status === 401) {
            navigate("/login")
            return
        }
        // Other errors: show the API's message
        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            setError(data.error || "Could not save the ad")
            return
        }

        // Success: replace the old ad with the updated one in the list
        const updatedAd = await response.json()
        setAds(ads.map((ad) => (ad.id === updatedAd.id ? updatedAd : ad)))
        setSelectedAd(updatedAd)
        setEditedAd(null)
    }

    // Deletes the selected ad: DELETE /ads/<id>
    async function handleDelete() {
        // Confirmation, because the deletion also removes its applications
        if (!window.confirm("Delete this ad? Its applications will be deleted too.")) return
        setError("")
        const token = localStorage.getItem("token")

        const response = await fetch(`${API}/ads/${selectedAd.id}`, {
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

        // Success: remove the ad from the list and close the details
        setAds(ads.filter((ad) => ad.id !== selectedAd.id))
        setSelectedAd(null)
        setEditedAd(null)
    }

    // Page protection: logged out → login page, not an admin → home
    useEffect(() => {
        if (role === null) navigate("/login")
        else if (role !== "admin") navigate("/")
    }, [role, navigate])
    // Shows nothing while the redirect happens
    // (placed after every hook: React requires hooks to always run in the same order)
    if (role !== "admin") return null

    return (
        <div>
            <h1>Admin</h1>

            {/* Tab bar: aria-pressed tells which tab is active */}
            <nav>
                {TABS.map((name) => (
                    <button
                        key={name}
                        onClick={() => setTab(name)}
                        aria-pressed={tab === name}
                    >
                        {name}
                    </button>
                ))}
            </nav>

            {/* "Ads" tab: still written directly in this file */}
            {tab === "Ads" && (
                <>
                    {/* List of every ad */}
                    {ads.map((ad) => (
                        <div key={ad.id}>
                            <h2>{ad.title}</h2>
                            <p>{ad.short_description}</p>
                            <button type="button" onClick={() => selectAd(ad)}>View details</button>
                        </div>
                    ))}

                    {/* Details of the selected ad (read-only mode) */}
                    {selectedAd && !editedAd && (
                        <div>
                            <h2>{selectedAd.title}</h2>
                            <p>{selectedAd.short_description}</p>
                            <p>{selectedAd.description}</p>
                            <p>Company: {companyName(selectedAd.company_id)}</p>
                            <p>Category: {categoryName(selectedAd.category_id)}</p>
                            {/* Optional fields: only shown when filled in */}
                            {selectedAd.place && <p>Place: {selectedAd.place}</p>}
                            {selectedAd.contract_type && <p>Contract: {selectedAd.contract_type}</p>}
                            {selectedAd.working_time && <p>Working time: {selectedAd.working_time}</p>}
                            {selectedAd.salary_min && selectedAd.salary_max && (
                                <p>Salary: {selectedAd.salary_min} - {selectedAd.salary_max}</p>
                            )}
                            {/* Date formatted as day/month/year */}
                            <p>Posted: {new Date(selectedAd.posted_at).toLocaleString("en-GB")}</p>

                            {error && <p>{error}</p>}
                            {/* Edit copies the ad into editedAd to switch to edit mode */}
                            <button type="button" onClick={() => setEditedAd(selectedAd)}>Edit</button>
                            <button type="button" onClick={handleDelete}>Delete</button>
                            <button type="button" onClick={() => setSelectedAd(null)}>Close</button>
                        </div>
                    )}

                    {/* Edit form (controlled fields: every value comes from editedAd) */}
                    {editedAd && (
                        <form onSubmit={handleSave}>
                            <h2>Edit ad #{editedAd.id}</h2>

                            <label htmlFor="title">Title</label>
                            <input id="title" type="text" maxLength={200} value={editedAd.title}
                                onChange={(e) => handleChange("title", e.target.value)} required />

                            <label htmlFor="short_description">Short description</label>
                            <input id="short_description" type="text" maxLength={300} value={editedAd.short_description}
                                onChange={(e) => handleChange("short_description", e.target.value)} required />

                            <label htmlFor="description">Description</label>
                            <textarea id="description" value={editedAd.description}
                                onChange={(e) => handleChange("description", e.target.value)} required />

                            {/* ?? "" : a null value becomes "" so React keeps the field controlled */}
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

                            {/* Values must match exactly what the database stores */}
                            <label htmlFor="contract_type">Contract type</label>
                            <select id="contract_type" value={editedAd.contract_type ?? ""}
                                onChange={(e) => handleChange("contract_type", e.target.value)}>
                                <option value="">Not specified</option>
                                <option value="permanemt">Permanemt</option>
                                <option value="temporary">Temporary</option>
                                <option value="internship">Internship</option>
                                <option value="apprenticeship">Apprenticeship</option>
                            </select>

                            {/* Categories loaded from the API */}
                            <label htmlFor="category_id">Category</label>
                            <select id="category_id" value={editedAd.category_id}
                                onChange={(e) => handleChange("category_id", e.target.value)} required>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>

                            {error && <p>{error}</p>}
                            <button type="submit">Save</button>
                            {/* Cancel: leaves edit mode without saving */}
                            <button type="button" onClick={() => setEditedAd(null)}>Cancel</button>
                        </form>
                    )}
                </>
            )}

            {/* The other tabs, each in its own component */}
            {tab === "People" && <PeopleTab />}
            {tab === "Applications" && <ApplicationsTab />}
            {tab === "Categories" && <CategoriesTab />}
            {tab === "Companies" && <CompaniesTab />}

            <button type="button" onClick={() => navigate("/")}>Return to homepage</button>
        </div>
    )
}

export default AdminPage