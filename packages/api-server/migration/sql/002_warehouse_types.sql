-- warehouse schema + enum types

-- Name: warehouse; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS warehouse;


--

-- Name: account_type; Type: TYPE; Schema: warehouse; Owner: -
--

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


--

-- Name: entity_ig_role; Type: TYPE; Schema: warehouse; Owner: -
--

CREATE TYPE warehouse.entity_ig_role AS ENUM (
    'primary',
    'regional',
    'secondary'
);


--
