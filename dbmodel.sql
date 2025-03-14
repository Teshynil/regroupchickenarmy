-- ------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- RegroupChickenArmy implementation : © Teshynil me@teshynil.dev
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----
-- dbmodel.sql
-- This is the file where you are describing the database schema of your game
-- Basically, you just have to export from PhpMyAdmin your table structure and copy/paste
-- this export here.
-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here
-- Note: The database schema is created from this file when the game starts. If you modify this file,
--       you have to restart a game to see your changes in database.
-- Example 1: create a standard "card" table to be used with the "Deck" tools (see example game "hearts"):
-- CREATE TABLE IF NOT EXISTS `card` (
--   `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
--   `card_type` varchar(16) NOT NULL,
--   `card_type_arg` int(11) NOT NULL,
--   `card_location` varchar(16) NOT NULL,
--   `card_location_arg` int(11) NOT NULL,
--   PRIMARY KEY (`card_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
-- Example 2: add a custom field to the standard "player" table
-- ALTER TABLE `player` ADD `player_my_custom_field` INT UNSIGNED NOT NULL DEFAULT '0';
CREATE TABLE IF NOT EXISTS `boards` (
    `movement_id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
    `board_id` int(1) UNSIGNED NOT NULL,
    `card_id` int(3) UNSIGNED NOT NULL,
    `rotation` int(1) UNSIGNED NOT NULL,
    `position` varchar(5) NOT NULL,
    PRIMARY KEY (`movement_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
CREATE TABLE IF NOT EXISTS `cards` (
    `card_id` int(3) UNSIGNED NOT NULL,
    `card_effects` varchar(11) NOT NULL,
    PRIMARY KEY (`card_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
INSERT INTO `cards` (`card_id`, `card_effects`)
VALUES (0, 'F1,W1,B2,S1'),
    (1, 'S2,F1,W1,B1'),
    (2, 'B1,W2,S1,F1'),
    (3, 'W1,S1,F1,C2'),
    (4, 'C1,B1,W1,S1'),
    (5, 'W1,C1,B1,F1'),
    (6, 'F2,S1,B1,W1'),
    (7, 'F1,W1,C1,B1'),
    (8, 'B2,EE,F2,W1'),
    (9, 'F1,S2,EE,W2'),
    (10, 'EE,B2,W1,F2'),
    (11, 'S2,EE,W2,F1'),
    (12, 'B1,C2,F1,W1'),
    (13, 'W1,F1,S1,C1'),
    (14, 'W1,B2,S1,F1'),
    (15, 'F1,W1,B1,S2'),
    (16, 'W2,S1,F1,B1'),
    (17, 'S1,F1,C2,W1'),
    (18, 'B1,W1,S1,C1'),
    (19, 'C1,B1,F1,W1'),
    (20, 'S1,B1,W1,F2'),
    (21, 'W1,C1,B1,F1'),
    (22, 'EE,F2,W1,B2'),
    (23, 'S2,EE,F1,W2'),
    (24, 'B2,W1,F2,EE'),
    (25, 'EE,W2,F1,S2'),
    (26, 'W2,F1,B1,W1'),
    (27, 'S1,F1,F2,W1'),
    (28, 'F2,W1,W1,F1'),
    (29, 'S2,W1,F2,EE'),
    (30, 'F2,EE,C1,F1'),
    (31, 'B2,W1,F1,S1'),
    (32, 'W1,F1,S2,B1'),
    (33, 'W1,F1,B1,W2'),
    (34, 'W1,F2,S1,B1'),
    (35, 'W2,B2,EE,F1'),
    (36, 'EE,W1,F2,S2'),
    (37, 'W1,C1,EE,W2'),
    (38, 'EE,F2,W2,B1'),
    (39, 'W2,S1,EE,F2'),
    (40, 'B1,EE,F2,W2'),
    (41, 'F2,EE,W2,S1'),
    (42, 'F1,C2,S1,B1'),
    (99, 'S1,W1,B1,F1'),
    (100, 'F2,C1,F1,W1'),
    (101, 'B1,C2,F1,S2'),
    (102, 'W2,S1,C1,F1'),
    (103, 'W1,S1,B2,S1');
CREATE TABLE IF NOT EXISTS `market` (
    `order` int(3) UNSIGNED NOT NULL AUTO_INCREMENT,
    `card_id` int(3) UNSIGNED NOT NULL,
    PRIMARY KEY (`order`),
    KEY `card_id_fk` (`card_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
ALTER TABLE `player`
ADD `position` INT UNSIGNED DEFAULT NULL;