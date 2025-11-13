-- Drop and recreate the handle_new_user function to include account and membership creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_account_id uuid;
  new_user_id uuid;
  workspace_name text;
  workspace_slug text;
BEGIN
  -- Insert user profile
  INSERT INTO public.users (auth_user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  )
  RETURNING id INTO new_user_id;

  -- Generate workspace name and slug
  workspace_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || '''s Workspace';
  workspace_slug := regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))), '[^a-z0-9]+', '-', 'g') || '-' || extract(epoch from now())::bigint::text;

  -- Create default account
  INSERT INTO public.accounts (name, slug, plan, status)
  VALUES (
    workspace_name,
    workspace_slug,
    'free',
    'active'
  )
  RETURNING id INTO new_account_id;

  -- Create account membership with owner role
  INSERT INTO public.account_memberships (account_id, user_id, role)
  VALUES (new_account_id, new_user_id, 'owner');

  RETURN NEW;
END;
$function$;