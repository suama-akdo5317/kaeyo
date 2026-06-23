"use client";
import type { Group } from "@/lib/types";

interface GroupSwitcherProps {
  groups: Group[];
  currentGroupId: string;
  onChange: (groupId: string) => void;
}

export function GroupSwitcher({
  groups,
  currentGroupId,
  onChange,
}: GroupSwitcherProps) {
  // グループが1つだけのときは切り替える意味がないので非表示
  if (groups.length <= 1) return null;

  return (
    <select
      value={currentGroupId}
      onChange={(e) => onChange(e.target.value)}
      aria-label="リストを切り替え"
      className="px-3 py-[7px] border-[1.5px] border-[#e3d9c7] rounded-[10px] bg-input text-muted-strong text-[13px] font-medium max-w-[160px] transition hover:bg-[#f1e9da] focus:border-accent focus:outline-none"
    >
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
