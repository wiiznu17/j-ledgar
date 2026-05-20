-- V8__drop_reward_accounts.sql
-- Drop the reward_accounts table as the loyalty system is now consolidated in the Portal Service.

SET search_path TO finance, public;

DROP TABLE IF EXISTS reward_accounts CASCADE;
