-- ------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- RegroupChickenArmy implementation : © Teshynil me@teshynil.dev
--
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----


-- Create the boards moves
CREATE TABLE IF NOT EXISTS `boards_moves` (
    `movement_id` int UNSIGNED NOT NULL AUTO_INCREMENT,
    `board_id` int UNSIGNED NOT NULL,
    `card_id` int UNSIGNED NOT NULL,
    `rotation` int UNSIGNED NOT NULL,
    `x` int UNSIGNED NOT NULL,
    `y` int UNSIGNED NOT NULL,
    PRIMARY KEY (`movement_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create the player boards
CREATE TABLE IF NOT EXISTS `boards` (
    `board_id` int UNSIGNED NOT NULL,
    `grid` text NOT NULL,
    PRIMARY KEY (`board_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create the available cards
CREATE TABLE IF NOT EXISTS `cards` (
    `card_id` int UNSIGNED NOT NULL,
    `s1` varchar(2) NOT NULL,
    `s2` varchar(2) NOT NULL,
    `s3` varchar(2) NOT NULL,
    `s4` varchar(2) NOT NULL,
    PRIMARY KEY (`card_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

INSERT INTO `cards` (`card_id`, `s1`,`s2`,`s3`,`s4`)
VALUES (0, 'EE','EE','EE','EE'),
    (1, 'F1','W1','B2','S1'),
    (2, 'S2','F1','W1','B1'),
    (3, 'B1','W2','S1','F1'),
    (4, 'W1','S1','F1','C2'),
    (5, 'M1','B1','W1','S1'),
    (6, 'W1','M1','B1','F1'),
    (7, 'F2','S1','B1','W1'),
    (8, 'F1','W1','M1','B1'),
    (9, 'B2','EE','F2','W1'),
    (10, 'F1','S2','EE','W2'),
    (11, 'EE','B2','W1','F2'),
    (12, 'S2','EE','W2','F1'),
    (13, 'B1','C2','F1','W1'),
    (14, 'W1','F1','S1','M1'),
    (15, 'W1','B2','S1','F1'),
    (16, 'F1','W1','B1','S2'),
    (17, 'W2','S1','F1','B1'),
    (18, 'S1','F1','C2','W1'),
    (19, 'B1','W1','S1','M1'),
    (20, 'M1','B1','F1','W1'),
    (21, 'S1','B1','W1','F2'),
    (22, 'W1','M1','B1','F1'),
    (23, 'EE','F2','W1','B2'),
    (24, 'S2','EE','F1','W2'),
    (25, 'B2','W1','F2','EE'),
    (26, 'EE','W2','F1','S2'),
    (27, 'W2','F1','B1','W1'),
    (28, 'S1','F1','F2','W1'),
    (29, 'F2','W1','W1','F1'),
    (30, 'S2','W1','F2','EE'),
    (31, 'F2','EE','M1','F1'),
    (32, 'B2','W1','F1','S1'),
    (33, 'W1','F1','S2','B1'),
    (34, 'W1','F1','B1','W2'),
    (35, 'W1','F2','S1','B1'),
    (36, 'W2','B2','EE','F1'),
    (37, 'EE','W1','F2','S2'),
    (38, 'W1','M1','EE','W2'),
    (39, 'EE','F2','W2','B1'),
    (40, 'W2','S1','EE','F2'),
    (41, 'B1','EE','F2','W2'),
    (42, 'F2','EE','W2','S1'),
    (43, 'F1','C2','S1','B1'),
    (99, 'S1','W1','B1','F1'),
    (100, 'F2','M1','F1','W1'),
    (101, 'B1','C2','F1','S2'),
    (102, 'W2','S1','M1','F1'),
    (103, 'W1','S1','B2','S1');

-- Create the market
CREATE TABLE IF NOT EXISTS `market` (
    `market_id` int UNSIGNED NOT NULL AUTO_INCREMENT,
    `order` int UNSIGNED NOT NULL,
    `card_id` int UNSIGNED NOT NULL,
    PRIMARY KEY (`market_id`),
    KEY `card_id_fk` (`card_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create the players resources
CREATE TABLE IF NOT EXISTS `resources` (
    `leader_id` int UNSIGNED NOT NULL,
    `fighter` int UNSIGNED NOT NULL,
    `wizard` int UNSIGNED NOT NULL,
    `shield` int UNSIGNED NOT NULL,
    `barrier` int UNSIGNED NOT NULL,
    `potion` int UNSIGNED NOT NULL,
    `coin` int UNSIGNED NOT NULL,
    `health` int NOT NULL,
    PRIMARY KEY (`leader_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create player data table to store game-specific player information
CREATE TABLE IF NOT EXISTS `playerData` (
    `player_id` int UNSIGNED NOT NULL,
    `is_dead` int UNSIGNED NOT NULL DEFAULT 0,
    `is_first` int UNSIGNED DEFAULT NULL,
    `has_attacked` int UNSIGNED DEFAULT NULL,
    `has_healed` int UNSIGNED DEFAULT NULL,
    `marketCardPicked` int UNSIGNED DEFAULT NULL,
    `leader_id` int UNSIGNED DEFAULT NULL,
    `order_id` int UNSIGNED DEFAULT NULL,
    PRIMARY KEY (`player_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;