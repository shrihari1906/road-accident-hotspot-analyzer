import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config


def get_connection():
    try:
        connection = psycopg2.connect(
            Config.DATABASE_URL,
            cursor_factory=RealDictCursor
        )
        return connection

    except Exception as e:
        print(f"Database Connection Error: {e}")
        raise