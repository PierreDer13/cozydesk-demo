export function getRole(){
    
   try {
    const token = localStorage.getItem("token")
    if (token === null) return null
    const parts = token.split(".")
    const middle = parts[1]
    const base64 = middle.replaceAll("-", "+").replaceAll("_", "/")
    const json = atob(base64)
    const payload = JSON.parse(json)
    return payload.role ?? null
} catch {
        null
   } 
}