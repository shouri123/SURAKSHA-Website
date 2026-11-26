GRANT UPDATE (status) ON public.citizen_sos_reports TO authenticated;

CREATE POLICY "sos_update_staff"
ON public.citizen_sos_reports
FOR UPDATE
TO authenticated
USING ((SELECT app_private.user_has_any_role(ARRAY['admin', 'operator'])))
WITH CHECK ((SELECT app_private.user_has_any_role(ARRAY['admin', 'operator'])));
