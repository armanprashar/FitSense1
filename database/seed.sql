INSERT INTO users (email, password, name, age, weight, height, gender, fitness_level)
VALUES ('demo@fitsense.ai', '$2a$10$2WvEZV3DYcQhD6m9.2k9W.gmCQztLHxHE.gm1f9RsxDkJEQduW64W', 'Demo User', 29, 72, 175, 'male', 'Intermediate')
ON CONFLICT (email) DO NOTHING;
