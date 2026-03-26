CREATE DATABASE [NextPlay];
GO

USE [NextPlay];
GO

IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'admin')
BEGIN
    CREATE LOGIN [admin] WITH PASSWORD = 'NextPlay1234', CHECK_POLICY = OFF;
    ALTER SERVER ROLE [sysadmin] ADD MEMBER [admin];
END
GO

CREATE TABLE Users (
    user_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY ,
    username varchar ( 256 ), 
);
GO

CREATE TABLE User_Teams (
    user_team_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY ,
    user_id INT,
    league_id INT,
    roster JSON NOT NULL,
    FOREIGN KEY(user_id) REFERENCES Users(user_id),
    FOREIGN KEY(league_id) REFERENCES Leagues(league_id)
);
GO

CREATE TABLE Leagues (
    league_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY ,
    sport_id INT,
    rankings JSON NOT NULL,
    game_results JSON NOT NULL,
    FOREIGN KEY(usport_id) REFERENCES Sports(sport_id)
);
GO

CREATE TABLE Game_Results (
    game_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY ,
    home_team_id INT,
    away_team_id INT,
    game_results JSON NOT NULL,
);
GO

CREATE TABLE College (
    team_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY ,
    team_name VARCHAR(256),
    division VARCHAR(256),
);
GO

CREATE TABLE Player (
    player_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY ,
    player_name VARCHAR(256),
    sport_id INT,
    player_stats JSON NOT NULL,
    FOREIGN KEY(sport_id) REFERENCES Sports(sport_id)
);
GO

CREATE TABLE Sports (
    sport_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    sport_name VARCHAR(256)
);
GO

INSERT INTO [Users] (username)
VALUES
('BigCheese');

INSERT INTO [Sports] (sport_name)
VALUES
('Football'),
('Basketball'),
('Baseball');

