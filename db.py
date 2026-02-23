import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="corede-mysql-south.mysql.database.azure.com",
        user="coredeadmin",
        password="Mysql@2026",
        database="corede_db",
        port=3306,
        ssl_disabled=False
    )
