// import axios from "axios"

// chrome.runtime.onInstalled.addListener(() => {
//   console.log("Extension installed")
//   checkAuthentication()
// })

// async function checkAuthentication() {
//   console.log("Checking authentication")
//   const token = await getToken()
//   if (token) {
//     console.log("Token found:", token)
//     try {
//       const isValid = await validateToken(token)
//       console.log("Token validation result:", isValid)
//       chrome.storage.local.set({ isAuthenticated: isValid, loading: false })
//       chrome.runtime.sendMessage({
//         type: isValid ? "AUTH_SUCCESS" : "AUTH_FAILURE"
//       })
//     } catch (error) {
//       console.error("Error validating token:", error)
//       chrome.storage.local.set({ isAuthenticated: false, loading: false })
//       chrome.runtime.sendMessage({ type: "AUTH_FAILURE" })
//     }
//   } else {
//     console.log("No token found")
//     chrome.storage.local.set({ isAuthenticated: false, loading: false })
//     chrome.runtime.sendMessage({ type: "AUTH_FAILURE" })
//   }
// }

// function getToken(): Promise<string | null> {
//   console.log("Getting token from storage")
//   return new Promise((resolve) => {
//     chrome.storage.local.get("authToken", (result) => {
//       console.log("Storage result:", result)
//       resolve(result.authToken || null)
//     })
//   })
// }

// async function validateToken(token: string): Promise<boolean> {
//   console.log("Validating token:", token)
//   try {
//     const response = await axios.post(
//       "http://localhost:3000/api/auth/validateToken",
//       {},
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`
//         }
//       }
//     )
//     console.log("Validation response:", response.data)
//     return response.status == 200
//   } catch (error) {
//     console.error("Error during validation:", error)
//     return false
//   }
// }

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Received message:", message)
//   if (message.type === "CHECK_AUTH") {
//     checkAuthentication()
//     sendResponse({ status: "Checking authentication" })
//   }
//   return true
// })

// setInterval(() => {
//   chrome.runtime.sendMessage({ message: "Test" })
// }, 1000)
export {}

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)
