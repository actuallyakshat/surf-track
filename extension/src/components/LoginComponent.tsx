import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"
import { LoaderCircle } from "lucide-react"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useGlobalContext } from "../context/globalContext"
import TopBar from "./TopBar"

interface FormErrors {
  username?: string
  password?: string
}

const LoginComponent = () => {
  const { setIsAuthenticated } = useGlobalContext()
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {}
    if (!username.trim()) errors.username = "Username is required."
    if (!password.trim()) errors.password = "Password is required."
    return errors
  }

  const handleLogin = async () => {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          username,
          password
        }
      )

      if (response.status === 200) {
        setError("")
        setStatus("Login successful")
        chrome.storage.local.set({ surfTrack_token: response.data.data })
        setIsAuthenticated(true)
        navigate("/")
      } else {
        setError("Invalid credentials")
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed")
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col items-center h-full w-full my-auto">
      <TopBar />
      <div className="my-auto flex flex-col items-center justify-center w-full">
        <h1 className="text-2xl font-black text-center">Welcome Back</h1>
        <p className="text-sm font-medium text-muted-foreground">
          Login to synchronise your data across devices
        </p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {status && <p className="mt-2 text-sm text-lime-500">{status}</p>}
        <form
          className="pt-4 space-y-3 w-full px-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            await handleLogin()
            setLoading(false)
          }}>
          <Input
            placeholder="Username"
            value={username}
            className={`w-full ${formErrors.username ? "border-red-500" : ""}`}
            onChange={(e) => {
              setUsername(e.target.value)
              setFormErrors((prev) => ({ ...prev, username: "" }))
            }}
          />
          {formErrors.username && (
            <p className="text-red-500 text-sm">{formErrors.username}</p>
          )}

          <Input
            placeholder="Password"
            type="password"
            value={password}
            className={`w-full ${formErrors.password ? "border-red-500" : ""}`}
            onChange={(e) => {
              setPassword(e.target.value)
              setFormErrors((prev) => ({ ...prev, password: "" }))
            }}
          />
          {formErrors.password && (
            <p className="text-red-500 text-sm">{formErrors.password}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <LoaderCircle className="animate-spin size-5" />
            ) : (
              "Login"
            )}
          </Button>
        </form>
        <div className="px-4 w-full">
          <p className="text-xs font-medium text-muted-foreground my-2 text-center">
            Don't have an account?
          </p>
          <Button
            onClick={() => navigate("/register")}
            variant="outline"
            className="w-full">
            Register
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoginComponent
