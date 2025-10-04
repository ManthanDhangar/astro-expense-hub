-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create approvals table for multi-level approval tracking
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  approver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  level INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- Create approval_rules table for company approval configuration
CREATE TABLE public.approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  rule_type TEXT NOT NULL,
  threshold DECIMAL(10,2),
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  percentage INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at columns
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at
BEFORE UPDATE ON public.approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for companies
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert companies"
ON public.companies
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles in their company"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') AND
  user_id IN (SELECT id FROM public.profiles WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses"
ON public.expenses
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers and admins can view all expenses in company"
ON public.expenses
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')) AND
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Employees can insert their own expenses"
ON public.expenses
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their own pending expenses"
ON public.expenses
FOR UPDATE
USING (user_id = auth.uid() AND status = 'pending');

-- RLS Policies for approvals
CREATE POLICY "Users can view approvals for their expenses"
ON public.approvals
FOR SELECT
USING (expense_id IN (SELECT id FROM public.expenses WHERE user_id = auth.uid()));

CREATE POLICY "Managers can view approvals in their company"
ON public.approvals
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')) AND
  expense_id IN (SELECT id FROM public.expenses WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Managers can insert approvals"
ON public.approvals
FOR INSERT
WITH CHECK (
  (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')) AND
  approver_id = auth.uid()
);

CREATE POLICY "Managers can update their approvals"
ON public.approvals
FOR UPDATE
USING (approver_id = auth.uid());

-- RLS Policies for approval_rules
CREATE POLICY "Users can view their company's approval rules"
ON public.approval_rules
FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage approval rules"
ON public.approval_rules
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') AND
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

-- Storage policies for receipts
CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Managers can view all receipts in company"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'receipts' AND
  (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'))
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_id_var UUID;
  user_role app_role;
BEGIN
  -- Extract metadata from signup
  company_id_var := (NEW.raw_user_meta_data->>'company_id')::UUID;
  user_role := (NEW.raw_user_meta_data->>'role')::app_role;
  
  -- Insert profile
  INSERT INTO public.profiles (id, company_id, full_name, email)
  VALUES (
    NEW.id,
    company_id_var,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(user_role, 'employee'));
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();