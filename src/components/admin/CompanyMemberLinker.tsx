"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { CompanyLinkedMember } from "@/shared/types/corporate.types";

interface CompanyMemberLinkerProps {
  companyMembers: CompanyLinkedMember[];
  onLinkMember: (userId: number) => void;
  onClose: () => void;
  isPending: boolean;
}

export function CompanyMemberLinker({
  companyMembers,
  onLinkMember,
  onClose,
  isPending,
}: CompanyMemberLinkerProps) {
  const [memberQuery, setMemberQuery] = useState("");
  const { data: memberSearchData } = trpc.members.search.useQuery(
    { q: memberQuery },
    { enabled: memberQuery.length > 2 },
  );

  return (
    <div className="panel p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium mb-2">Search Members</label>
        <input
          type="text"
          value={memberQuery}
          onChange={(e) => setMemberQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          style={{ borderColor: "var(--border)" }}
          placeholder="Search by name or email (3+ chars)"
          disabled={isPending}
        />
      </div>

      {memberSearchData && memberSearchData.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {memberSearchData
            .filter(
              (user) =>
                !companyMembers.some((m) => m.id === user.id),
            )
            .map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 border rounded"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs muted">{user.email}</div>
                </div>
                <button
                  onClick={() => onLinkMember(user.id)}
                  className="btn btn-sm"
                  disabled={isPending}
                >
                  Add
                </button>
              </div>
            ))}
        </div>
      )}

      <button
        type="button"
        className="btn-outline"
        onClick={() => {
          onClose();
          setMemberQuery("");
        }}
        disabled={isPending}
      >
        Done
      </button>
    </div>
  );
}
