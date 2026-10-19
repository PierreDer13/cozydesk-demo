// =====================================================
// CompaniesTab: company management (admin)
// Features: list, create, edit, delete
// =====================================================

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
// Shared helper: adds the token, parses the JSON, throws { status, message } on error
import { adminFetch } from "./adminApi.js"

function CompaniesTab() {
    const navigate = useNavigate()

    // =================================================
    // 1. STATE
    // =================================================

    // Data
    const [companies, setCompanies] = useState([])

    // UI
    const [isLoading, setIsLoading] = useState(true)
    // Prevents double submissions while a request is running
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    // Creation (one state per form field)
    const [newName, setNewName] = useState("")
    const [newLocation, setNewLocation] = useState("")
    const [newWebsite, setNewWebsite] = useState("")
    const [newDescription, setNewDescription] = useState("")

    // Editing a row (editingId = the company being edited, editedCompany = its working copy)
    const [editingId, setEditingId] = useState(null)
    const [editedCompany, setEditedCompany] = useState(null)

    // =================================================
    // 2. HELPERS
    // =================================================

    // Shared error handling: 401 -> login, otherwise message on screen
    function handleError(err) {
        if (err.status === 401) {
            navigate("/login")
            return
        }
        setError(err.message)
    }

    // =================================================
    // 3. DATA LOADING
    // =================================================

    // GET /companies (no ?page= → the full array)
    async function loadCompanies() {
        try {
            const data = await adminFetch("/companies")
            setCompanies(Array.isArray(data) ? data : [])
        } catch (err) {
            handleError(err)
        } finally {
            setIsLoading(false)
        }
    }

    // Loaded once, on first render
    useEffect(() => {
        loadCompanies()
    }, [])

    // =================================================
    // 4. CREATION
    // =================================================

    // POST /companies, then reload the list
    async function handleCreate(e) {
        e.preventDefault() // stop the page from reloading
        // The name is required; trim() makes "   " count as empty
        if (newName.trim() === "" || isSubmitting) return

        setError("")
        setIsSubmitting(true)

        try {
            await adminFetch("/companies", {
                method: "POST",
                body: JSON.stringify({
                    name: newName.trim(),
                    location: newLocation,
                    website: newWebsite,
                    description: newDescription,
                }),
            })
            // Success: empty the form and reload the list
            setNewName("")
            setNewLocation("")
            setNewWebsite("")
            setNewDescription("")
            await loadCompanies()
        } catch (err) {
            handleError(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // =================================================
    // 5. EDITING
    // =================================================

    // Updates a single field of the company being edited, keeping the others
    function handleEditChange(field, value) {
        setEditedCompany({ ...editedCompany, [field]: value })
    }

    // PUT /companies/<id>
    async function handleUpdate(id) {
        // Guard: empty name, or a request already running
        if (editedCompany.name.trim() === "" || isSubmitting) return

        setError("")
        setIsSubmitting(true)

        try {
            await adminFetch(`/companies/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    name: editedCompany.name.trim(),
                    location: editedCompany.location,
                    website: editedCompany.website,
                    description: editedCompany.description,
                }),
            })
            // Success: leave edit mode and reload the list
            setEditingId(null)
            setEditedCompany(null)
            await loadCompanies()
        } catch (err) {
            handleError(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // =================================================
    // 6. DELETION (409 if the company is still in use)
    // =================================================

    // DELETE /companies/<id>; the API's 409 message is shown via handleError
    async function handleDelete(id) {
        if (!window.confirm("Delete this company?")) return
        setError("")
        try {
            await adminFetch(`/companies/${id}`, {
                method: "DELETE",
            })
            await loadCompanies()
        } catch (err) {
            err.status === 401 ? navigate("/login") : alert(err.message)
        }
    }

    // =================================================
    // 7. RENDERING
    // =================================================

    // While the first load is running
    if (isLoading) return <p>Loading...</p>

    return (
        <section>
            <h2>Companies</h2>

            {/* Error message (role="alert": announced by screen readers) */}
            {error && <p role="alert">Error: {error}</p>}

            {/* Creation form */}
            <form onSubmit={handleCreate}>
                <label htmlFor="name">Name</label>
                <input
                    id="name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                />

                <label htmlFor="location">Location</label>
                <input
                    id="location"
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                />

                {/* type="url": the browser checks the format (https://...) */}
                <label htmlFor="website">Website</label>
                <input
                    id="website"
                    type="url"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                />

                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                />

                <button type="submit" disabled={isSubmitting}>Add</button>
            </form>

            {/* Company list (or empty state) */}
            {companies.length === 0 ? (
                <p>No companies yet.</p>
            ) : (
                <ul>
                    {companies.map((company) => (
                        <li key={company.id}>
                            {editingId === company.id ? (
                                // ----- Edit mode: fields pre-filled + Save / Cancel -----
                                // (?? "" turns null into "" so the fields stay controlled)
                                <>
                                    <input
                                        type="text"
                                        aria-label="Company name"
                                        placeholder="Name"
                                        value={editedCompany.name ?? ""}
                                        onChange={(e) => handleEditChange("name", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        aria-label="Company location"
                                        placeholder="Location"
                                        value={editedCompany.location ?? ""}
                                        onChange={(e) => handleEditChange("location", e.target.value)}
                                    />
                                    <input
                                        type="url"
                                        aria-label="Company website"
                                        placeholder="Website (https://...)"
                                        value={editedCompany.website ?? ""}
                                        onChange={(e) => handleEditChange("website", e.target.value)}
                                    />
                                    <textarea
                                        aria-label="Company description"
                                        placeholder="Description"
                                        value={editedCompany.description ?? ""}
                                        onChange={(e) => handleEditChange("description", e.target.value)}
                                    />
                                    <button type="button" onClick={() => handleUpdate(company.id)} disabled={isSubmitting}>Save</button>
                                    <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                                </>
                            ) : (
                                // ----- Normal mode: info + Edit / Delete -----
                                <>
                                    <strong>{company.name}</strong>
                                    {/* Optional fields: only shown when filled in */}
                                    {company.location && <p>Location: {company.location}</p>}
                                    {company.website && <p>Website: {company.website}</p>}
                                    {company.description && <p>Description: {company.description}</p>}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Enter edit mode with a copy of the company
                                            setEditingId(company.id)
                                            setEditedCompany(company)
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button type="button" onClick={() => handleDelete(company.id)}>Delete</button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default CompaniesTab