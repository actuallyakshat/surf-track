import axios from "axios"
import React, { useState } from "react"

const LoginComponent = ({
  setIsAuthenticated
}: {
  setIsAuthenticated: Function
}) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          username,
          password
        }
      )

      if (response.status === 200) {
        console.log(response.data.data)
        setStatus("Login successful")
        chrome.storage.sync.set({ authToken: response.data.data })
        chrome.runtime.sendMessage({ type: "AUTH_SUCCESS" })
        setIsAuthenticated(true)
        setStatus(response.data.data)
      } else {
        setStatus("Invalid credentials")
      }
    } catch (error) {
      setStatus("Login failed")
      console.error(error)
    }
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-black">Login</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        className="px-4 py-2 focus:outline-none border rounded-lg border-zinc-400"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        className="px-4 py-2 focus:outline-none border rounded-lg border-zinc-400"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-zinc-700 text-white font-medium rounded-lg">
        Login
      </button>
      {status && <p>{status}</p>}
    </div>
  )
}

export default LoginComponent
