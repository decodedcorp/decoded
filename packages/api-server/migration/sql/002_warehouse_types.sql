-- warehouse schema + enum types

-- Name: warehouse; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS warehouse;


--

-- Name: account_type; Type: TYPE; Schema: warehouse; Owner: -
-- Idempotent: brownfield DB에 타입이 이미 있으면 건너뜀
--

DO $t$
BEGIN
    CREATE TYPE warehouse.account_type AS ENUM (
        'artist',
        'group',
        'brand',
        'source',
        'influencer',
        'place',
        'other',
        'company',
        'designer'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$t$;


--

-- Name: entity_ig_role; Type: TYPE; Schema: warehouse; Owner: -
--

DO $t$
BEGIN
    CREATE TYPE warehouse.entity_ig_role AS ENUM (
        'primary',
        'regional',
        'secondary'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$t$;


--
