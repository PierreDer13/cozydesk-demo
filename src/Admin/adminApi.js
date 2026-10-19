const API = "http://localhost:5000"

export async function adminFetch(path, options = {}) {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {"Content-Type": "application/json",
             Authorization: `Bearer ${token}`}
})
    const data = await response.json().catch(() => ({}))
if (!response.ok) {
    throw { status: response.status, message: data.error || "Something went wrong" }
}
return data
}