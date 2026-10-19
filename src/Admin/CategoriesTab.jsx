// =====================================================
// CategoriesTab: category management (admin)
// Features: list, create, rename, delete
// =====================================================

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
// Shared helper: adds the token, parses the JSON, throws { status, message } on error
import { adminFetch } from "./adminApi.js"

function CategoriesTab() {
    const navigate = useNavigate()

    // =================================================
    // 1. STATE
    // =================================================

    // Data
    const [categories, setCategories] = useState([])

    // UI
    const [isLoading, setIsLoading] = useState(true)
    // Prevents double submissions while a request is running
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    // Creation
    const [newName, setNewName] = useState("")

    // Renaming a row (editingId = the category being renamed, null = none)
    const [editingId, setEditingId] = useState(null)
    const [editedName, setEditedName] = useState("")

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

    // GET /categories (no ?page= → the full array)
    async function loadCategories() {
        try {
            const data = await adminFetch("/categories")
            setCategories(Array.isArray(data) ? data : [])
        } catch (err) {
            handleError(err)
        } finally {
            setIsLoading(false)
        }
    }

    // Loaded once, on first render
    useEffect(() => {
        loadCategories()
    }, [])

    // =================================================
    // 4. CREATION
    // =================================================

    // POST /categories, then reload the list
    async function handleCreate(e) {
        e.preventDefault() // stop the page from reloading
        // trim() removes spaces: "   " counts as empty
        if (newName.trim() === "" || isSubmitting) return

        setError("")
        setIsSubmitting(true)

        try {
            await adminFetch("/categories", {
                method: "POST",
                body: JSON.stringify({ name: newName.trim() }),
            })
            setNewName("") // empty the field after adding
            await loadCategories()
        } catch (err) {
            handleError(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // =================================================
    // 5. RENAMING
    // =================================================

    // PUT /categories/<id>, then leave rename mode
    async function handleRename(id) {
        if (editedName.trim() === "" || isSubmitting) return

        setError("")
        setIsSubmitting(true)

        try {
            await adminFetch(`/categories/${id}`, {
                method: "PUT",
                body: JSON.stringify({ name: editedName.trim() }),
            })
            setEditingId(null)
            await loadCategories()
        } catch (err) {
            handleError(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // =================================================
    // 6. DELETION (409 if the category is still in use)
    // =================================================

    // DELETE /categories/<id>; the API's 409 message is shown via handleError
    async function handleDelete(id) {
        if (!window.confirm("Delete this category?")) return
        setError("")
        try {
            await adminFetch(`/categories/${id}`, {
                method: "DELETE",
            })
            await loadCategories()
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
            <h2>Categories</h2>

            {/* Error message (role="alert": announced by screen readers) */}
            {error && <p role="alert">Error: {error}</p>}

            {/* Creation form */}
            <form onSubmit={handleCreate}>
                <label htmlFor="new-category">New category</label>
                <input
                    id="new-category"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                />
                <button type="submit" disabled={isSubmitting}>Add</button>
            </form>

            {/* Category list (or empty state) */}
            {categories.length === 0 ? (
                <p>No categories yet.</p>
            ) : (
                <ul>
                    {categories.map((category) => (
                        <li key={category.id}>
                            {editingId === category.id ? (
                                // ----- Rename mode: field + Save / Cancel -----
                                <>
                                    <input
                                        type="text"
                                        aria-label="Category name"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                    />
                                    <button type="button" onClick={() => handleRename(category.id)} disabled={isSubmitting}>Save</button>
                                    <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                                </>
                            ) : (
                                // ----- Normal mode: name + Rename / Delete -----
                                <>
                                    {category.name}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Enter rename mode, pre-filled with the current name
                                            setEditingId(category.id)
                                            setEditedName(category.name)
                                        }}
                                    >
                                        Rename
                                    </button>
                                    <button type="button" onClick={() => handleDelete(category.id)}>Delete</button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default CategoriesTab