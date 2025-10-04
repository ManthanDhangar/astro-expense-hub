import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'manager' | 'employee';

export interface UserProfile {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  currency: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  company_id: string;
  amount: number;
  currency: string;
  category: string;
  description?: string;
  expense_date: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const getUserRoles = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(r => r.role as UserRole);
};

export const hasRole = (roles: UserRole[], role: UserRole) => {
  return roles.includes(role);
};
