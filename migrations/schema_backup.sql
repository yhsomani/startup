--
-- PostgreSQL database dump
--

\restrict FUZZkOteHpbtSqLVNYWIWMdx8yrolfFxsVy9fsOM16cRe4QO1xmgIWc8lUbgm6F

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id character varying(36) NOT NULL,
    enrollment_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    course_id character varying(36) NOT NULL,
    course_title character varying(255) NOT NULL,
    user_name character varying(255) NOT NULL,
    certificate_url character varying(500) NOT NULL,
    verification_code character varying(100) NOT NULL,
    issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    dataset_url character varying(255),
    description text,
    evaluation_metric character varying(255),
    is_active boolean,
    passing_score numeric(38,2),
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- Name: course_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_skills (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    skill_name character varying(255) NOT NULL,
    course_id uuid NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    currency character varying(3),
    description text,
    is_active boolean,
    is_published boolean,
    preview_video_url character varying(255),
    price numeric(38,2) NOT NULL,
    subtitle character varying(255),
    thumbnail_url character varying(255),
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    instructor_id uuid NOT NULL
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid NOT NULL,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone,
    enrolled_at timestamp(6) without time zone,
    is_active boolean,
    last_accessed_at timestamp(6) without time zone,
    progress_percentage integer,
    updated_at timestamp(6) without time zone,
    course_id uuid NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_progress (
    id uuid NOT NULL,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone,
    is_active boolean,
    is_completed boolean,
    last_accessed_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    video_position_seconds integer,
    enrollment_id uuid NOT NULL,
    lesson_id uuid NOT NULL
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid NOT NULL,
    challenge_id uuid,
    content_markdown text,
    created_at timestamp(6) without time zone,
    description text,
    duration integer,
    is_active boolean,
    order_index integer NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    video_url character varying(255),
    section_id uuid NOT NULL,
    CONSTRAINT lessons_type_check CHECK (((type)::text = ANY ((ARRAY['video'::character varying, 'quiz'::character varying, 'challenge'::character varying, 'text'::character varying])::text[])))
);


--
-- Name: sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sections (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    is_active boolean,
    order_index integer NOT NULL,
    title character varying(255) NOT NULL,
    course_id uuid NOT NULL
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    feedback text,
    file_path character varying(255) NOT NULL,
    graded_at timestamp(6) without time zone,
    is_active boolean,
    score numeric(38,2),
    status character varying(255) NOT NULL,
    submitted_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    challenge_id uuid NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT submissions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'grading'::character varying, 'passed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id integer NOT NULL,
    user_id integer NOT NULL,
    badge_id character varying(50) NOT NULL,
    badge_name character varying(100),
    badge_icon character varying(10),
    earned_at timestamp without time zone
);


--
-- Name: user_badges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_badges_id_seq OWNED BY public.user_badges.id;


--
-- Name: user_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_points (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total_points integer,
    level integer,
    points_to_next_level integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: user_points_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_points_id_seq OWNED BY public.user_points.id;


--
-- Name: user_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_streaks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    current_streak integer,
    longest_streak integer,
    last_activity timestamp without time zone,
    streak_start_date timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: user_streaks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_streaks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_streaks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_streaks_id_seq OWNED BY public.user_streaks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    email character varying(255) NOT NULL,
    is_active boolean,
    password_hash character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['STUDENT'::character varying, 'INSTRUCTOR'::character varying, 'ADMIN'::character varying])::text[])))
);


--
-- Name: user_badges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges ALTER COLUMN id SET DEFAULT nextval('public.user_badges_id_seq'::regclass);


--
-- Name: user_points id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points ALTER COLUMN id SET DEFAULT nextval('public.user_points_id_seq'::regclass);


--
-- Name: user_streaks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks ALTER COLUMN id SET DEFAULT nextval('public.user_streaks_id_seq'::regclass);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_verification_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_verification_code_key UNIQUE (verification_code);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: course_skills course_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_skills
    ADD CONSTRAINT course_skills_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: users uk_6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: lesson_progress ukfsjlcxaxfenifmlnu5l6yxqgc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT ukfsjlcxaxfenifmlnu5l6yxqgc UNIQUE (enrollment_id, lesson_id);


--
-- Name: enrollments ukg1muiskd02x66lpy6fqcj6b9q; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT ukg1muiskd02x66lpy6fqcj6b9q UNIQUE (user_id, course_id);


--
-- Name: user_badges unique_user_badge; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_points user_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points
    ADD CONSTRAINT user_points_pkey PRIMARY KEY (id);


--
-- Name: user_points user_points_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points
    ADD CONSTRAINT user_points_user_id_key UNIQUE (user_id);


--
-- Name: user_streaks user_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_pkey PRIMARY KEY (id);


--
-- Name: user_streaks user_streaks_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_key UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: enrollments fk3hjx6rcnbmfw368sxigrpfpx0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk3hjx6rcnbmfw368sxigrpfpx0 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: submissions fk760bgu69957phd7hax608jdms; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk760bgu69957phd7hax608jdms FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sections fk7ty9cevpq04d90ohtso1q8312; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT fk7ty9cevpq04d90ohtso1q8312 FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: submissions fkblbgb61gxgclqvjeumlnxu2g9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fkblbgb61gxgclqvjeumlnxu2g9 FOREIGN KEY (challenge_id) REFERENCES public.challenges(id);


--
-- Name: courses fkcyfum8goa6q5u13uog0563gyp; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT fkcyfum8goa6q5u13uog0563gyp FOREIGN KEY (instructor_id) REFERENCES public.users(id);


--
-- Name: lessons fkgt4502q9pklwr02uqh3qnrppi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT fkgt4502q9pklwr02uqh3qnrppi FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: enrollments fkho8mcicp4196ebpltdn9wl6co; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fkho8mcicp4196ebpltdn9wl6co FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_skills fkiluo833xks9n59bftlo3dkx03; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_skills
    ADD CONSTRAINT fkiluo833xks9n59bftlo3dkx03 FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: lesson_progress fkkx3nc17yyecdqwfgdydqmc24x; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT fkkx3nc17yyecdqwfgdydqmc24x FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id);


--
-- Name: lesson_progress fkqwr70bkn0j6gok1y4op9jns8y; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT fkqwr70bkn0j6gok1y4op9jns8y FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FUZZkOteHpbtSqLVNYWIWMdx8yrolfFxsVy9fsOM16cRe4QO1xmgIWc8lUbgm6F

