from utils.db import get_connection

try:
    connection = get_connection()

    print("✅ Successfully connected to NeonDB!")

    cursor = connection.cursor()

    cursor.execute("SELECT version();")

    version = cursor.fetchone()

    print("Database Version:")
    print(version)

    cursor.close()
    connection.close()

except Exception as e:
    print("❌ Connection Failed!")
    print(e)