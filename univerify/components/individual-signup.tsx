"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { walletService } from "@/lib/wallet"
import { toast } from "react-toastify"

interface IndividualSignupProps {
  onComplete: (userData: { name: string; email: string }) => void
}

export function IndividualSignup({ onComplete }: IndividualSignupProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validate()) {
      setIsSubmitting(true)

      try {
        const response = await walletService.signupUser({ name, email })
        
        if (response.success) {
          toast.success("Account created successfully!")
          onComplete({ name, email })
        } else {
          toast.error("Failed to create account. Please try again.")
        }
      } catch (error) {
        console.error("Signup error:", error)
        toast.error("An error occurred during signup. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-4">
        {isSubmitting ? "Creating Account..." : "Complete Setup"}
      </Button>
    </div>
  )
}
