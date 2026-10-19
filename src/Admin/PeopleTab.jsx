// =====================================================
// PeopleTab : liste paginée des utilisateurs (admin)
// Fonctions : voir, modifier (rôle, entreprise...), supprimer
// =====================================================

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { adminFetch } from "./adminApi.js"

// --- Utilitaire : "" ou null -> null, sinon un nombre ---
function toNumberOrNull(value) {
    return value === "" || value === null ? null : Number(value)
}

function PeopleTab() {
    const navigate = useNavigate()

    // =================================================
    // 1. ÉTATS
    // =================================================

    // Données
    const [people, setPeople] = useState([])
    const [companies, setCompanies] = useState([])

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Interface
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    // Modification d'une ligne
    const [editingId, setEditingId] = useState(null)
    const [editedPerson, setEditedPerson] = useState(null)

    // Id de l'admin connecté (pour "(you)" et pas de suppression de soi-même)
    const currentUserId = Number(localStorage.getItem("id"))

    // =================================================
    // 2. OUTILS
    // =================================================

    // Gestion d'erreur commune : 401 -> login, sinon message à l'écran
    function handleError(err) {
        if (err.status === 401) {
            navigate("/login")
            return
        }
        setError(err.message)
    }

    // Nom d'une entreprise à partir de son id
    function companyName(id) {
        const company = companies.find((c) => c.id === id)
        return company ? company.name : `#${id}`
    }

    // =================================================
    // 3. CHARGEMENT DES DONNÉES
    // =================================================

    // Entreprises : liste déroulante d'édition + affichage des noms
    async function loadCompanies() {
        try {
            const data = await adminFetch("/companies")
            setCompanies(Array.isArray(data) ? data : (data.items ?? []))
        } catch (err) {
            handleError(err)
        }
    }

    // Personnes de la page courante
    async function loadPeople() {
        try {
            const data = await adminFetch(`/people?page=${page}`)
            const items = Array.isArray(data) ? data : (data.items ?? [])

            // Page vide (après une suppression) : on recule d'une page
            if (items.length === 0 && page > 1) {
                setPage(page - 1)
                return
            }

            setPeople(items)
            setTotalPages(data.total_pages ?? 1)
        } catch (err) {
            handleError(err)
        } finally {
            setIsLoading(false)
        }
    }

    // Recharge les personnes à chaque changement de page
    useEffect(() => {
        loadPeople()
    }, [page])

    // Charge les entreprises une seule fois
    useEffect(() => {
        loadCompanies()
    }, [])

    // =================================================
    // 4. MODIFICATION
    // =================================================

    // Met à jour un seul champ de la personne en cours d'édition
    function handleEditChange(field, value) {
        setEditedPerson({ ...editedPerson, [field]: value })
    }

    async function handleUpdate(id) {
        // Garde : champs obligatoires vides, ou envoi déjà en cours
        if (
            editedPerson.first_name.trim() === "" ||
            editedPerson.last_name.trim() === "" ||
            editedPerson.email.trim() === "" ||
            isSubmitting
        ) return

        setError("")
        setIsSubmitting(true)

        try {
            await adminFetch(`/people/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    first_name: editedPerson.first_name.trim(),
                    last_name: editedPerson.last_name.trim(),
                    email: editedPerson.email.trim(),
                    phone: editedPerson.phone || null,
                    role: editedPerson.role,
                    company_id: toNumberOrNull(editedPerson.company_id),
                }),
            })
            // Succès : on ferme le mode édition et on recharge la liste
            setEditingId(null)
            setEditedPerson(null)
            await loadPeople()
        } catch (err) {
            handleError(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // =================================================
    // 5. SUPPRESSION
    // =================================================

    async function handleDelete(id) {
        if (!window.confirm("Delete this person?")) return
        setError("")
        try {
            await adminFetch(`/people/${id}`, {
                method: "DELETE",
            })
            await loadPeople()
        } catch (err) {
            handleError(err)
        }
    }

    // =================================================
    // 6. AFFICHAGE
    // =================================================

    if (isLoading) return <p>Loading...</p>

    return (
        <section>
            <h2>People</h2>

            {/* Message d'erreur */}
            {error && <p role="alert">Error: {error}</p>}

            {/* Liste des personnes */}
            <ul>
                {people.map((person) => (
                    <li key={person.id}>
                        {editingId === person.id ? (
                            // ----- Mode édition -----
                            <>
                                <input
                                    type="text"
                                    aria-label="First name"
                                    placeholder="First name"
                                    value={editedPerson.first_name ?? ""}
                                    onChange={(e) => handleEditChange("first_name", e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    aria-label="Last name"
                                    placeholder="Last name"
                                    value={editedPerson.last_name ?? ""}
                                    onChange={(e) => handleEditChange("last_name", e.target.value)}
                                    required
                                />
                                <input
                                    type="email"
                                    aria-label="Email"
                                    placeholder="Email"
                                    value={editedPerson.email ?? ""}
                                    onChange={(e) => handleEditChange("email", e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    aria-label="Phone"
                                    placeholder="Phone"
                                    value={editedPerson.phone ?? ""}
                                    onChange={(e) => handleEditChange("phone", e.target.value)}
                                />
                                <select
                                    aria-label="Role"
                                    value={editedPerson.role ?? "user"}
                                    onChange={(e) => handleEditChange("role", e.target.value)}
                                >
                                    <option value="user">user</option>
                                    <option value="employer">employer</option>
                                    <option value="admin">admin</option>
                                </select>
                                <select
                                    aria-label="Company"
                                    value={editedPerson.company_id ?? ""}
                                    onChange={(e) => handleEditChange("company_id", e.target.value)}
                                >
                                    <option value="">No company</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>{company.name}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => handleUpdate(person.id)} disabled={isSubmitting}>Save</button>
                                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                            </>
                        ) : (
                            // ----- Mode normal -----
                            <>
                                <strong>{person.first_name} {person.last_name}</strong>
                                {person.id === currentUserId && " (you)"}
                                <p>{person.email}</p>
                                {person.phone && <p>{person.phone}</p>}
                                <p>Role: {person.role}</p>
                                {person.company_id && <p>Company: {companyName(person.company_id)}</p>}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(person.id)
                                        setEditedPerson(person)
                                    }}
                                >
                                    Edit
                                </button>
                                {person.id !== currentUserId && (
                                    <button type="button" onClick={() => handleDelete(person.id)}>Delete</button>
                                )}
                            </>
                        )}
                    </li>
                ))}
            </ul>

            {/* Pagination */}
            <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</button>
        </section>
    )
}

export default PeopleTab