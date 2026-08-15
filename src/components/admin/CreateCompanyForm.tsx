"use client";

import { useState } from "react";
import type { CreateCompanyInput } from "@/shared/schemas/corporate.schema";

interface CreateCompanyFormProps {
  onSubmit: (input: CreateCompanyInput) => void;
  onCancel: () => void;
  isPending: boolean;
  error?: string;
}

export function CreateCompanyForm({
  onSubmit,
  onCancel,
  isPending,
  error,
}: CreateCompanyFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState("0");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    if (!name.trim() || !email.trim()) {
      setValidationError("Name and email are required");
      return;
    }
    onSubmit({
      name: name.trim(),
      contactEmail: email.trim(),
      creditPoolBalance: parseInt(credits, 10) || 0,
    });
  };

  const displayError = validationError || error;

  return (
    <div className="panel p-6 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Create New Company</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={{ borderColor: "var(--border)" }}
            placeholder="e.g. TechCorp Inc"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contact Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={{ borderColor: "var(--border)" }}
            placeholder="contact@techcorp.com"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Initial Credit Pool</label>
          <input
            type="number"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={{ borderColor: "var(--border)" }}
            placeholder="0"
            disabled={isPending}
            min="0"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn"
            disabled={isPending || !name.trim() || !email.trim()}
          >
            {isPending ? "Creating..." : "Create Company"}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </button>
        </div>

        {displayError && (
          <div className="p-3 rounded" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
            <p style={{ color: "#ef4444" }}>{displayError}</p>
          </div>
        )}
      </form>
    </div>
  );
}
