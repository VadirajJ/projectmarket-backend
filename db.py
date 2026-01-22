import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="Vadiraj@9008",
        database="corede_db",
        port=3306,
        auth_plugin="mysql_native_password",
        use_pure=True,
        connection_timeout=5
    )
