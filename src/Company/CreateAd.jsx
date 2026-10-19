import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { getRole } from "../auth.js"

// Ad creation page (employers and admins)
function CreateAd() {
    // Controlled form fields: one state per field
    const [title, setTitle] = useState("")
    const [short_description, setShort_description] = useState("")
    const [description, setDescription] = useState("")
    // Salaries kept as text ("" = not filled in), converted at submit time
    const [salary_min, setSalary_min] = useState("")
    const [salary_max, setSalary_max] = useState("")
    // Prevents double submissions while the request is running
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [place, setPlace] = useState("")
    // Default values = the first option of each select
    const [working_time, setWorking_time] = useState("Full-time")
    const [contract_type, setContract_type] = useState("Permanent")
    // Categories loaded from the API for the dropdown
    const [categories, setCategories] = useState([])
    const [category_id, setCategory_id] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()

    // On first render: GET /categories to fill the dropdown
    useEffect(() => {
        fetch("http://localhost:5000/categories")
            .then((response) => response.json())
            .then((data) => setCategories(Array.isArray(data) ? data : []))
    }, [])

    // POST /ads with the token, then back to the home page
    async function handleSubmit(e) {
        e.preventDefault() // stop the page from reloading
        if (isSubmitting) return
        setIsSubmitting(true)
        setError("")
        try {
            // No token = not logged in
            const token = localStorage.getItem("token")
            if (!token) {
                navigate("/login")
                return
            }

            const response = await fetch("http://localhost:5000/ads", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    short_description,
                    description,
                    // Empty salary → null; otherwise converted to a number
                    salary_min: salary_min === "" ? null : Number(salary_min),
                    salary_max: salary_max === "" ? null : Number(salary_max),
                    place,
                    working_time,
                    contract_type,
                    // The select gives text: convert it to a number for the API
                    category_id: Number(category_id),
                }),
            })

            // 401 = expired token: log in again
            if (response.status === 401) {
                navigate("/login")
                return
            }
            // Other errors: show the API's message
            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not create the ad")
                return
            }
        } catch (error) {
            // Network error (API stopped…)
            setError("Sorry, we could not create your ad")
            return
        } finally {
            // Runs in every case: re-enables the button
            setIsSubmitting(false)
        }

        // Only reached when everything succeeded (every error path above returns)
        navigate("/")
    }

    // Page protection: logged out → login, users → home
    const role = getRole()
    const canCreateAd = role === "employer" || role === "admin"
    useEffect(() => {
        if (role === null) navigate("/login")
        else if (!canCreateAd) navigate("/")
    }, [role, canCreateAd, navigate])
    // Shows nothing while the redirect happens (after every hook, as React requires)
    if (!canCreateAd) return null

    return (
        <div>
            <form onSubmit={handleSubmit}>
                {/* maxLength matches the column sizes in the database */}
                <label htmlFor="title">Title</label>
                <input id="title" type="text" maxLength={200} value={title}
                    onChange={(e) => setTitle(e.target.value)} required />

                <label htmlFor="short_description">Short description</label>
                <input id="short_description" type="text" maxLength={300} value={short_description}
                    onChange={(e) => setShort_description(e.target.value)} required />

                <label htmlFor="description">Description</label>
                <textarea id="description" value={description}
                    onChange={(e) => setDescription(e.target.value)} required />

                {/* Optional salaries */}
                <label htmlFor="salary_min">Salary minimum</label>
                <input id="salary_min" type="number" value={salary_min}
                    onChange={(e) => setSalary_min(e.target.value)} />

                <label htmlFor="salary_max">Salary maximum</label>
                <input id="salary_max" type="number" value={salary_max}
                    onChange={(e) => setSalary_max(e.target.value)} />

                <label htmlFor="place">Place</label>
                <input id="place" type="text" maxLength={100} value={place}
                    onChange={(e) => setPlace(e.target.value)} />

                <label htmlFor="working_time">Working time</label>
                <select id="working_time" value={working_time}
                    onChange={(e) => setWorking_time(e.target.value)}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                </select>

                {/* Values exactly as stored in the database */}
                <label htmlFor="contract_type">Contract type</label>
                <select id="contract_type" value={contract_type}
                    onChange={(e) => setContract_type(e.target.value)}>
                    <option value="Permanent">Permanent</option>
                    <option value="Fixed-term">Fixed-term</option>
                    <option value="Apprenticeship">Apprenticeship</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                </select>

                {/* Empty first option + required: forces a choice */}
                <label htmlFor="category_id">Category</label>
                <select id="category_id" value={category_id}
                    onChange={(e) => setCategory_id(e.target.value)} required>
                    <option value="">Choose a category...</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>

                {error && <p>{error}</p>}
                {/* The label changes while sending */}
                <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create the ad"}</button>
            </form>
            <button type="button" onClick={() => navigate("/")}>Return to homepage</button>
        </div>
    )
}

export default CreateAd