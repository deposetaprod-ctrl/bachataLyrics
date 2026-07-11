-- Exécutez ce script dans l'éditeur SQL de Supabase pour ajouter vos notes.
-- ⚠️ ATTENTION : Vous devez d'abord récupérer votre ID utilisateur (user_id).
-- Vous pouvez le trouver dans la table `auth.users` de votre projet Supabase.

-- Remplacez 'VOTRE_USER_ID_ICI' par votre véritable ID (ex: '123e4567-e89b-12d3-a456-426614174000')

DO $$
DECLARE
    my_user_id UUID := 'VOTRE_USER_ID_ICI'; -- <=== REMPLACEZ CECI PAR VOTRE USER ID
BEGIN
    INSERT INTO public.academy_notes (user_id, content) VALUES
    (my_user_id, 'pousser dans le sol, la hanche est une conséquence, on pousse dans le sol, jamais je suis tendu et verrouillé, prends le temps doux, la montée, imagine l''énergie. si je vais à droite je pousse sur ma jambe gauche. le bassin est la conséquence du transfert du poid, et le buste est une conséquence tu tire vers le haut tout en jouant avec tes omoplates pour qu''elles coulisses mais les coudes ne vont jamais derrieres, et tu fais des clés de bras en mode comme si tu courrais et le 3 4 tu ralentis et les mains restent au niveau du ventre'),
    (my_user_id, 'travailler carré'),
    (my_user_id, 'mumbo'),
    (my_user_id, 'passeo'),
    (my_user_id, 'pas de son'),
    (my_user_id, 'écrasé'),
    (my_user_id, 'les syncopes (contre temps)'),
    (my_user_id, 'Marcher comme un chat, un peu sur l''avant des pieds le buste vers l''avant, et un peu sur les pointes pas sur les talons'),
    (my_user_id, 'activer les ailes, activer le haut du dos, activer le core, les abdos pour plus de controles'),
    (my_user_id, 'les épaules ne montent pas sur une vague'),
    (my_user_id, 'travailler sur des mergingues'),
    (my_user_id, 'pause avant de marquer un instrument particulier'),
    (my_user_id, 'Shoulder aligné avec ton poids et le contre poinds sur fait avec la hanche'),
    (my_user_id, 'aller vers le bas avec les genous mais pas se baisser en avant sur la révérance');
END $$;
