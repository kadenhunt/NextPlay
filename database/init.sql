CREATE TABLE IF NOT EXISTS public."Sports"
(
    sport_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    sport text COLLATE pg_catalog."default",
    CONSTRAINT "Sports_pkey" PRIMARY KEY (sport_id),
    CONSTRAINT sport UNIQUE (sport)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Sports"
    OWNER to admin;

CREATE TABLE IF NOT EXISTS public."Users"
(
    user_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    CONSTRAINT "Users_pkey" PRIMARY KEY (user_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Users"
    OWNER to admin;

CREATE TABLE IF NOT EXISTS public."Leagues"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    rankings json NOT NULL,
    commissioner integer NOT NULL,
    sport integer NOT NULL,
    CONSTRAINT league_id PRIMARY KEY (id),
    CONSTRAINT commissioner_user_id FOREIGN KEY (commissioner)
        REFERENCES public."Users" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT sport_id FOREIGN KEY (sport)
        REFERENCES public."Sports" (sport_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Leagues"
    OWNER to admin;
-- Index: fki_sport_id

-- DROP INDEX IF EXISTS public.fki_sport_id;

CREATE INDEX IF NOT EXISTS fki_sport_id
    ON public."Leagues" USING btree
    (sport ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public."UserTeam"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id integer NOT NULL,
    league_id integer NOT NULL,
    roster json,
    CONSTRAINT "UserTeam_pkey" PRIMARY KEY (id),
    CONSTRAINT league_id FOREIGN KEY (league_id)
        REFERENCES public."Leagues" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT user_id FOREIGN KEY (user_id)
        REFERENCES public."Users" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."UserTeam"
    OWNER to admin;

CREATE TABLE IF NOT EXISTS public."Players"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name text COLLATE pg_catalog."default" NOT NULL,
    team_id integer NOT NULL,
    CONSTRAINT player_id PRIMARY KEY (id),
    CONSTRAINT team_id FOREIGN KEY (team_id)
        REFERENCES public."UserTeam" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Players"
    OWNER to admin;

CREATE TABLE IF NOT EXISTS public."GameResults"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    home_id integer NOT NULL,
    away_id integer NOT NULL,
    results json NOT NULL,
    CONSTRAINT "GameResults_pkey" PRIMARY KEY (id),
    CONSTRAINT away_team_id FOREIGN KEY (away_id)
        REFERENCES public."UserTeam" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT home_team_id FOREIGN KEY (home_id)
        REFERENCES public."UserTeam" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."GameResults"
    OWNER to admin;

INSERT INTO public."Sports" (sport)
	VALUES
	('Football'), ('Basketball'), ('Baseball');

-- Account fields for server-backed auth (safe to re-run)
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS email VARCHAR(320);
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS display_name VARCHAR(256);
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
    ON public."Users" (LOWER(email))
    WHERE email IS NOT NULL;