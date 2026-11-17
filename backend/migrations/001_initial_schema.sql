-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS accidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    location_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,

    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,

    severity VARCHAR(20) NOT NULL CHECK
    (
        severity IN ('Low','Medium','High','Fatal')
    ),

    weather_condition VARCHAR(50) NOT NULL,

    road_condition VARCHAR(50) DEFAULT 'Unknown',

    accident_date DATE NOT NULL,

    accident_time TIME,

    num_vehicles INTEGER DEFAULT 1,

    num_casualties INTEGER DEFAULT 0,

    description TEXT,

    road_type VARCHAR(50),
    vehicle_type VARCHAR(50),
    speed_limit INTEGER,
    cause VARCHAR(100),
    traffic_density VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);