-- ------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- RegroupChickenArmy implementation : © Teshynil me@teshynil.dev
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----


-- Create the boards
CREATE TABLE IF NOT EXISTS `boards` (
    `movement_id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
    `board_id` int(1) UNSIGNED NOT NULL,
    `card_id` int(3) UNSIGNED NOT NULL,
    `rotation` int(1) UNSIGNED NOT NULL,
    `position` varchar(5) NOT NULL,
    PRIMARY KEY (`movement_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create the available cards
CREATE TABLE IF NOT EXISTS `cards` (
    `card_id` int(3) UNSIGNED NOT NULL,
    `card_effects` varchar(11) NOT NULL,
    PRIMARY KEY (`card_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
INSERT INTO `cards` (`card_id`, `card_effects`)
VALUES (0, 'EE,EE,EE,EE'),
    (1, 'F1,W1,B2,S1'),
    (2, 'S2,F1,W1,B1'),
    (3, 'B1,W2,S1,F1'),
    (4, 'W1,S1,F1,C2'),
    (5, 'C1,B1,W1,S1'),
    (6, 'W1,C1,B1,F1'),
    (7, 'F2,S1,B1,W1'),
    (8, 'F1,W1,C1,B1'),
    (9, 'B2,EE,F2,W1'),
    (10, 'F1,S2,EE,W2'),
    (11, 'EE,B2,W1,F2'),
    (12, 'S2,EE,W2,F1'),
    (13, 'B1,C2,F1,W1'),
    (14, 'W1,F1,S1,C1'),
    (15, 'W1,B2,S1,F1'),
    (16, 'F1,W1,B1,S2'),
    (17, 'W2,S1,F1,B1'),
    (18, 'S1,F1,C2,W1'),
    (19, 'B1,W1,S1,C1'),
    (20, 'C1,B1,F1,W1'),
    (21, 'S1,B1,W1,F2'),
    (22, 'W1,C1,B1,F1'),
    (23, 'EE,F2,W1,B2'),
    (24, 'S2,EE,F1,W2'),
    (25, 'B2,W1,F2,EE'),
    (26, 'EE,W2,F1,S2'),
    (27, 'W2,F1,B1,W1'),
    (28, 'S1,F1,F2,W1'),
    (29, 'F2,W1,W1,F1'),
    (30, 'S2,W1,F2,EE'),
    (31, 'F2,EE,C1,F1'),
    (32, 'B2,W1,F1,S1'),
    (33, 'W1,F1,S2,B1'),
    (34, 'W1,F1,B1,W2'),
    (35, 'W1,F2,S1,B1'),
    (36, 'W2,B2,EE,F1'),
    (37, 'EE,W1,F2,S2'),
    (38, 'W1,C1,EE,W2'),
    (39, 'EE,F2,W2,B1'),
    (40, 'W2,S1,EE,F2'),
    (41, 'B1,EE,F2,W2'),
    (42, 'F2,EE,W2,S1'),
    (43, 'F1,C2,S1,B1'),
    (99, 'S1,W1,B1,F1'),
    (100, 'F2,C1,F1,W1'),
    (101, 'B1,C2,F1,S2'),
    (102, 'W2,S1,C1,F1'),
    (103, 'W1,S1,B2,S1');

-- Create the market
CREATE TABLE IF NOT EXISTS `market` (
    `order` int(3) UNSIGNED NOT NULL AUTO_INCREMENT,
    `card_id` int(3) UNSIGNED NOT NULL,
    PRIMARY KEY (`order`),
    KEY `card_id_fk` (`card_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Add leader position and picked card to player
ALTER TABLE `player`
    ADD `position` INT UNSIGNED DEFAULT NULL,
    ADD `marketCardPicked` INT UNSIGNED DEFAULT NULL;