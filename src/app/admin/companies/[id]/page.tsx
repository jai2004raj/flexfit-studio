"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CompanyTopUpForm } from "@/components/admin/CompanyTopUpForm";
import { CompanyMemberLinker } from "@/components/admin/CompanyMemberLinker";
import { CompanyRecentBookings } from "@/components/admin/CompanyRecentBookings";

export default function CompanyDetailsPage() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const { data: company, isLoading, refetch } = trpc.adminCompanies.getById.useQuery({ id });
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const topUpMutation = trpc.adminCompanies.topUp.useMutation({
    onSuccess: () => {
      setShowTopUpForm(false);
      refetch();
    },
  });

  const activeMutation = trpc.adminCompanies.updateActive.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const linkMutation = trpc.adminCompanies.linkMember.useMutation({
    onSuccess: () => {
      setShowMemberForm(false);
      refetch();
    },
  });

  const unlinkMutation = trpc.adminCompanies.unlinkMember.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleTopUp = (amount: number) => {
    topUpMutation.mutate({ id, amount });
  };

  const handleToggleActive = () => {
    if (company) {
      activeMutation.mutate({ id, active: !company.active });
    }
  };

  const handleLinkMember = (userId: number) => {
    linkMutation.mutate({ companyId: id, userId });
  };

  if (isLoading) return <p className="muted">Loading...</p>;
  if (!company) return <p className="muted">Company not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
          <p className="muted text-sm">{company.contactEmail}</p>
        </div>
        <button
          onClick={handleToggleActive}
          className={company.active ? "btn btn-danger btn-sm" : "btn btn-sm"}
          disabled={activeMutation.isPending}
        >
          {company.active ? "Deactivate" : "Activate"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-4">
          <div className="muted text-xs uppercase tracking-wide mb-2">Credit Pool Balance</div>
          <div className="text-2xl font-semibold">{company.creditPoolBalance}</div>
          <button
            onClick={() => setShowTopUpForm(!showTopUpForm)}
            className="btn btn-sm mt-3"
          >
            Top Up
          </button>
        </div>

        <div className="panel p-4">
          <div className="muted text-xs uppercase tracking-wide mb-2">Linked Members</div>
          <div className="text-2xl font-semibold">{company.members.length}</div>
          <button
            onClick={() => setShowMemberForm(!showMemberForm)}
            className="btn btn-sm mt-3"
          >
            Add Member
          </button>
        </div>
      </div>

      {showTopUpForm && (
        <CompanyTopUpForm
          onTopUp={handleTopUp}
          onCancel={() => setShowTopUpForm(false)}
          isPending={topUpMutation.isPending}
        />
      )}

      {showMemberForm && (
        <CompanyMemberLinker
          companyMembers={company.members}
          onLinkMember={handleLinkMember}
          onClose={() => setShowMemberForm(false)}
          isPending={linkMutation.isPending}
        />
      )}

      <div className="space-y-3">
        <h2 className="font-medium">Linked Members ({company.members.length})</h2>
        {company.members.length > 0 ? (
          <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
            {company.members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-3">
                <div className="flex-1">
                  <div className="font-medium text-sm">{member.name}</div>
                  <div className="text-xs muted">{member.email}</div>
                </div>
                <button
                  onClick={() => unlinkMutation.mutate({ companyMemberId: member.companyMemberId })}
                  className="btn-outline btn-sm text-red-600"
                  disabled={unlinkMutation.isPending}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel p-4 text-center muted">No members linked yet</div>
        )}
      </div>

      <CompanyRecentBookings bookings={company.recentBookings} />
    </div>
  );
}
