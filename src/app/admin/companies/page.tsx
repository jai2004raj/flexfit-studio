"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CreateCompanyForm } from "@/components/admin/CreateCompanyForm";
import type { CreateCompanyInput } from "@/shared/schemas/corporate.schema";

export default function CompaniesPage() {
  const { data: companies, isLoading, refetch } = trpc.adminCompanies.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createMutation = trpc.adminCompanies.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setSuccess(true);
      setError("");
      refetch();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleCreate = (input: CreateCompanyInput) => {
    setError("");
    createMutation.mutate(input);
  };

  if (isLoading) return <p className="muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Corporate Memberships</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-sm"
          >
            New Company
          </button>
        )}
      </div>

      {success && (
        <div className="p-3 rounded" style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}>
          <p style={{ color: "var(--accent)" }}>Company created successfully!</p>
        </div>
      )}

      {showForm && (
        <CreateCompanyForm
          onSubmit={handleCreate}
          onCancel={() => {
            setShowForm(false);
            setError("");
          }}
          isPending={createMutation.isPending}
          error={error}
        />
      )}

      <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
        {companies && companies.length > 0 ? (
          companies.map((c) => (
            <Link
              key={c.id}
              href={`/admin/companies/${c.id}`}
              className="flex items-center gap-4 p-4 hover:opacity-75 transition"
            >
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm muted">{c.contactEmail}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{c.creditPoolBalance} credits</div>
                <div className={`text-sm ${c.active ? "text-green-600" : "text-red-600"}`}>
                  {c.active ? "Active" : "Inactive"}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-4 text-center muted">No companies yet</div>
        )}
      </div>
    </div>
  );
}
