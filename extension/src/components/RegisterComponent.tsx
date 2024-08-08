import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"
import { LoaderCircle } from "lucide-react"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

import TopBar from "./TopBar"

interface FormErrors {
  username?: string
  password?: string
  confirmPassword?: string
}

const RegisterComponent: React.FC = () => {
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {}
    if (!username.trim()) errors.username = "Username is required."
    if (!password.trim()) errors.password = "Password is required."
    if (password.length < 6)
      errors.password = "Password must be at least 6 characters."
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match."
    return errors
  }

  async function handleRegister() {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setLoading(true)

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/register",
        {
          username: username,
          password: password
        }
      )
      if (response.status === 200) {
        setError("")
        setStatus("Account created successfully!")
        navigate("/login")
      } else {
        setError(response.data.message)
      }
    } catch (error: any) {
      console.log(error)
      setError(error.response?.data?.message || "An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full my-auto">
      <TopBar />
      <div className="my-auto flex flex-col items-center justify-center w-full">
        <h1 className="text-2xl font-black text-center">Hey There!</h1>
        <p className="text-sm font-medium text-muted-foreground max-w-md text-center px-2">
          An account will help you synchronise your data across devices
        </p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {status && <p className="mt-2 text-sm text-lime-500">{status}</p>}
        <form
          className="mt-4 space-y-3 w-full px-4"
          onSubmit={async (e) => {
            e.preventDefault()
            await handleRegister()
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

          <Input
            placeholder="Confirm Password"
            type="password"
            value={confirmPassword}
            className={`w-full ${formErrors.confirmPassword ? "border-red-500" : ""}`}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setFormErrors((prev) => ({ ...prev, confirmPassword: "" }))
            }}
          />
          {formErrors.confirmPassword && (
            <p className="text-red-500 text-sm">{formErrors.confirmPassword}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <LoaderCircle className="animate-spin size-5" />
            ) : (
              "Register"
            )}
          </Button>
        </form>

        <div className="px-4 w-full">
          <p className="text-xs font-medium text-muted-foreground my-2 text-center">
            Already have an account?
          </p>
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="w-full">
            Login
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RegisterComponent
