import mysql.connector
import os

def get_db_connection():
    # If running on Azure, use default SSL (no file)
    if os.environ.get("WEBSITE_HOSTNAME"):
        return mysql.connector.connect(
            host="corede-mysql-south.mysql.database.azure.com",
            user="coredeadmin@corede-mysql-south",
            password="Corede@2026",
            database="corede_db",
            port=3306,
            ssl_disabled=False
        )
    else:
        # Local machine (use certificate file)
        ssl_path = os.path.join(os.path.dirname(__file__), "BaltimoreCyberTrustRoot.crt.pem")

        return mysql.connector.connect(
            host="corede-mysql-south.mysql.database.azure.com",
            user="coredeadmin@corede-mysql-south",
            password="Corede@2026",
            database="corede_db",
            port=3306,
            ssl_ca=ssl_path
        )
