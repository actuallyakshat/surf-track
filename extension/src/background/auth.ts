import axios from "axios"

const BACKEND_URL = process.env.BACKEND_URL
export async function validateTokenAndFetchData() {
  const token = await chrome.storage.local.get("surfTrack_token")
  if (!token.surfTrack_token) {
    console.log("No token found")
  }
  try {
    const response = await axios.post(BACKEND_URL + "/api/auth/validateToken", {
      Headers: {
        Authorization: `Bearer ${token.surfTrack_token}`
      }
    })
    console.log(response.data)
    return response
  } catch (error) {
    console.log(error)
  }
}
