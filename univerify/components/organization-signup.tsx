"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OrganizationSignupProps {
  onComplete: (userData: { name: string; email: string }) => void
}

export function OrganizationSignup({ onComplete }: OrganizationSignupProps) {
  const [orgName, setOrgName] = useState("")
  const [businessEmail, setBusinessEmail] = useState("")
  const [orgType, setOrgType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ orgName?: string; businessEmail?: string; orgType?: string }>({})

  const validate = () => {
    const newErrors: { orgName?: string; businessEmail?: string; orgType?: string } = {}

    if (!orgName.trim()) {
      newErrors.orgName = "Organization name is required"
    }

    if (!businessEmail.trim()) {
      newErrors.businessEmail = "Business email is required"
    } else if (!/\S+@\S+\.\S+/.test(businessEmail)) {
      newErrors.businessEmail = "Email is invalid"
    }

    if (!orgType) {
      newErrors.orgType = "Organization type is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      setIsSubmitting(true)

      // Simulate API call
      setTimeout(() => {
        onComplete({ name: orgName, email: businessEmail })
        setIsSubmitting(false)
      }, 1000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization Name</Label>
        <Input
          id="orgName"
          placeholder="Enter your organization name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
        {errors.orgName && <p className="text-sm text-red-500">{errors.orgName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="orgType">Organization Type</Label>
        <Select onValueChange={setOrgType}>
          <SelectTrigger id="orgType">
            <SelectValue placeholder="Select organization type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="educational">Educational Institution</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="nonprofit">Non-profit</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.orgType && <p className="text-sm text-red-500">{errors.orgType}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessEmail">Business Email</Label>
        <Input
          id="businessEmail"
          type="email"
          placeholder="Enter your business email"
          value={businessEmail}
          onChange={(e) => setBusinessEmail(e.target.value)}
        />
        {errors.businessEmail && <p className="text-sm text-red-500">{errors.businessEmail}</p>}
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-4">
        {isSubmitting ? "Registering Organization..." : "Complete Registration"}
      </Button>
    </div>
  )
}
