
-- Revoke public execute on security definer functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- Storage policies for flowers bucket
CREATE POLICY "Public can view flower images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'flowers');

CREATE POLICY "Admins can upload flower images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'flowers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update flower images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'flowers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete flower images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'flowers' AND public.has_role(auth.uid(), 'admin'));
