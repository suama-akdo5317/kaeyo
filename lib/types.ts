export type Group = {
  id: string;
  name: string;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: "owner" | "member";
};

export type Category = {
  id: string;
  group_id: string;
  name: string;
  position: number;
  color: string;
};

export type Item = {
  id: string;
  group_id: string;
  category_id: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ItemHistory = {
  id: string;
  group_id: string;
  name: string;
};
