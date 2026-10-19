import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

function SignUp() {
    const [firstname, setFirstname] = useState("")
    const [lastname, setLastname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [type, setType] = useState("user")
    const [companies, setCompanies] = useState([])
    const [company_id, setCompany_id] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()



    useEffect(() => {
        fetch("http://localhost:5000/companies")
            .then((response) => response.json())
            .then((data) => setCompanies(data))
    }, [])
    async function handleSubmit(e) {
        e.preventDefault()
        setError("")

        const body = {
            first_name: firstname,
            last_name: lastname,
            email: email,
            password: password,
        }
        if (type === "company") {
            body.role = "employer"
            body.company_id = Number(company_id)
        }

        const reponse = await fetch("http://localhost:5000/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        if (!reponse.ok) {
            const data = await reponse.json().catch(() => ({}))
            setError(data.error || "Registration failed")
            return
        }

        navigate("/login")
    }
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>
                    <input
                        type="radio"
                        name="type"
                        value="user"
                        checked={type === "user"}
                        onChange={(e) => setType(e.target.value)}
                    />
                    User
                </label>
                <label>
                    <input
                        type="radio"
                        name="type"
                        value="company"
                        checked={type === "company"}
                        onChange={(e) => setType(e.target.value)}
                    />
                    Company
                </label>
                <label htmlFor="firstname">First name</label>

                <input
                    id="firstname"
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                />
                <label htmlFor="lastname">Last name</label>
                <input
                    id="lastname"
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                />
                {type === "company" && (
                    <div>
                        <label htmlFor="company">Company</label>
                        <select
                            id="company"
                            value={company_id}
                            onChange={(e) => setCompany_id(e.target.value)}
                            required
                        >
                            <option value="">Choose a company...</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p>{error}</p>}
                <button type="submit">Sign up</button>
            </form>

        </div>

    )
}
export default SignUp