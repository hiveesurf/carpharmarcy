-- CHECK user_profiles_email_format allows NULL or valid email, not empty string.
UPDATE user_profiles SET email = NULL WHERE email IS NOT NULL AND trim(email) = '';
