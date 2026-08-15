"use client";

import { useState } from "react";

interface CompanyTopUpFormProps {
  onTopUp: (amount: number) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function CompanyTopUpForm({
  onTopUp,
  onCancel,
  isPending,
}: CompanyTopUpFormProps) {
  const [topUpAmount, setTopUpAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(topUpAmount, 10);
    if (amount > 0) {
      onTopUp(amount);
      setTopUpAmount("");
    }
  };

  return (
    <div className="panel p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">Top Up Amount</label>
          <input
            type="number"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={{ borderColor: "var(--border)" }}
            placeholder="Number of credits"
            disabled={isPending}
            min="1"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn"
            disabled={isPending || !topUpAmount}
          >
            {isPending ? "Processing..." : "Top Up"}
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
      </form>
    </div>
  );
}
