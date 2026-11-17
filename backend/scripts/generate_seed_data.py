import random
import uuid
from datetime import datetime, timedelta

cities = [
    ("Bengaluru", "Karnataka", 12.9716, 77.5946),
    ("Mysuru", "Karnataka", 12.2958, 76.6394),
    ("Mangaluru", "Karnataka", 12.9141, 74.8560),
    ("Hubballi", "Karnataka", 15.3647, 75.1240),
    ("Dharwad", "Karnataka", 15.4589, 75.0078),
    ("Belagavi", "Karnataka", 15.8497, 74.4977),
    ("Kalaburagi", "Karnataka", 17.3297, 76.8343),
    ("Ballari", "Karnataka", 15.1394, 76.9214),
    ("Tumakuru", "Karnataka", 13.3409, 77.1010),
    ("Shivamogga", "Karnataka", 13.9299, 75.5681),
    ("Davanagere", "Karnataka", 14.4644, 75.9218),
    ("Hassan", "Karnataka", 13.0033, 76.1004),
    ("Udupi", "Karnataka", 13.3409, 74.7421),
    ("Chikkamagaluru", "Karnataka", 13.3153, 75.7754),
    ("Raichur", "Karnataka", 16.2120, 77.3439),
    ("Bidar", "Karnataka", 17.9133, 77.5301),
    ("Vijayapura", "Karnataka", 16.8302, 75.7100),
    ("Bagalkote", "Karnataka", 16.1867, 75.6961),
    ("Gadag", "Karnataka", 15.4315, 75.6340),
    ("Haveri", "Karnataka", 14.7937, 75.4041),
    ("Koppal", "Karnataka", 15.3452, 76.1548),
    ("Yadgir", "Karnataka", 16.7700, 77.1376),
    ("Mandya", "Karnataka", 12.5218, 76.8951),
    ("Ramanagara", "Karnataka", 12.7219, 77.2810),
    ("Chamarajanagar", "Karnataka", 11.9231, 76.9395),
    ("Karwar", "Karnataka", 14.8136, 74.1297),
    ("Sirsi", "Karnataka", 14.6197, 74.8355),
    ("Hosapete", "Karnataka", 15.2695, 76.3871),
    ("Puttur", "Karnataka", 12.7598, 75.2017),
    ("Bhadravati", "Karnataka", 13.8485, 75.7050)
]

road_types = [
    "National Highway",
    "State Highway",
    "City Road",
    "Rural Road",
    "Flyover",
    "Junction"
]

vehicle_types = [
    "Bike",
    "Car",
    "Bus",
    "Truck",
    "Auto Rickshaw",
    "Bicycle",
    "Tractor"
]

weather_conditions = [
    "Sunny",
    "Rainy",
    "Cloudy",
    "Foggy"
]

road_conditions = [
    "Dry",
    "Wet",
    "Under Construction"
]

traffic_density = [
    "Low",
    "Medium",
    "High"
]

causes = [
    "Overspeeding",
    "Drunk Driving",
    "Distracted Driving",
    "Signal Violation",
    "Wrong Side Driving",
    "Mechanical Failure",
    "Poor Road Condition",
    "Animal Crossing",
    "Weather Conditions"
]

severity_levels = [
    "Low",
    "Medium",
    "High",
    "Fatal"
]

def random_date():
    start = datetime(2024, 1, 1)
    end = datetime(2026, 7, 1)

    delta = end - start
    random_days = random.randint(0, delta.days)

    return start + timedelta(days=random_days)


def random_time():
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)

    return f"{hour:02}:{minute:02}:00"

def random_coordinates(lat, lon):
    latitude = round(lat + random.uniform(-0.05, 0.05), 6)
    longitude = round(lon + random.uniform(-0.05, 0.05), 6)

    return latitude, longitude


def random_severity():
    return random.choices(
        severity_levels,
        weights=[45, 30, 20, 5],
        k=1
    )[0]


city_weights = [
    120, 45, 35, 35, 25,
    30, 20, 20, 20, 20,
    20, 18, 18, 15, 15,
    12, 12, 10, 10, 10,
    10, 8, 10, 8, 8,
    8, 8, 8, 8, 8
]


def random_city():
    return random.choices(
        cities,
        weights=city_weights,
        k=1
    )[0]



sql_file = "../migrations/002_seed_accidents.sql"

with open(sql_file, "w", encoding="utf-8") as file:
        file.write("-- Auto Generated Accident Seed Data\n\n")

sql_file = "../migrations/002_seed_accidents.sql"

with open(sql_file, "w", encoding="utf-8") as file:

    file.write("-- Auto Generated Accident Seed Data\n\n")

    for _ in range(500):

        city, state, city_lat, city_lon = random_city()

        latitude, longitude = random_coordinates(city_lat, city_lon)

        accident_date = random_date().strftime("%Y-%m-%d")
        accident_time = random_time()

        severity = random_severity()

        road_type = random.choice(road_types)
        vehicle_type = random.choice(vehicle_types)
        weather = random.choice(weather_conditions)
        road_condition = random.choice(road_conditions)
        traffic = random.choice(traffic_density)
        cause = random.choice(causes)

        speed_limit = random.choice([30, 40, 50, 60, 80, 100])

        num_vehicles = random.randint(1, 5)

        if severity == "Low":
            num_casualties = random.randint(0, 1)
        elif severity == "Medium":
            num_casualties = random.randint(1, 2)
        elif severity == "High":
            num_casualties = random.randint(2, 4)
        else:
            num_casualties = random.randint(3, 6)

        location_name = f"{road_type} near {city}"
        description = f"{cause} accident involving {vehicle_type}"

        sql = f"""INSERT INTO accidents (
id,
location_name,
city,
state,
latitude,
longitude,
severity,
weather_condition,
road_condition,
accident_date,
accident_time,
num_vehicles,
num_casualties,
description,
road_type,
vehicle_type,
speed_limit,
cause,
traffic_density
)
VALUES (
'{uuid.uuid4()}',
'{location_name}',
'{city}',
'{state}',
{latitude},
{longitude},
'{severity}',
'{weather}',
'{road_condition}',
'{accident_date}',
'{accident_time}',
{num_vehicles},
{num_casualties},
'{description}',
'{road_type}',
'{vehicle_type}',
{speed_limit},
'{cause}',
'{traffic}'
);

"""

        file.write(sql)

print("✅ Successfully generated 002_seed_accidents.sql")