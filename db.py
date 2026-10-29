from __future__ import annotations

import os
import ssl
import time
import urllib.parse
from typing import Any, Dict, List, Optional
import pymysql

# -----------------------------------------------------------------------------
# TiDB Serverless & MySQL Cloud Configuration
# Supports either DATABASE_URL or individual TIDB_* environment variables
# -----------------------------------------------------------------------------
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
TIDB_HOST = os.environ.get("TIDB_HOST", "").strip()
TIDB_PORT = int(os.environ.get("TIDB_PORT", "4000"))
TIDB_USER = os.environ.get("TIDB_USER", "").strip()
TIDB_PASSWORD = os.environ.get("TIDB_PASSWORD", "").strip()
TIDB_DATABASE = os.environ.get("TIDB_DATABASE", "lokatravel").strip()

# In-memory fallback repository when cloud DB credentials are not yet supplied
_MEM_USERS: Dict[str, Dict[str, Any]] = {}
_MEM_RATINGS: Dict[str, Dict[str, float]] = {}
_MEM_BOOKINGS: Dict[str, List[Dict[str, Any]]] = {}


def _parse_db_url() -> Dict[str, Any]:
    if not DATABASE_URL:
        return {}
    try:
        url = urllib.parse.urlparse(DATABASE_URL)
        return {
            "host": url.hostname or "localhost",
            "port": url.port or 4000,
            "user": url.username or "root",
            "password": url.password or "",
            "database": url.path.lstrip("/") or "lokatravel",
        }
    except Exception:
        return {}


def get_db_connection() -> Optional[pymysql.connections.Connection]:
    """
    Establishes a TLS-secured MySQL connection to TiDB Serverless Cloud.
    Returns None if no database configuration is present or if connection fails.
    """
    config = _parse_db_url()
    host = config.get("host") or TIDB_HOST
    port = config.get("port") or TIDB_PORT
    user = config.get("user") or TIDB_USER
    password = config.get("password") or TIDB_PASSWORD
    database = config.get("database") or TIDB_DATABASE

    if not host or not user:
        return None

    try:
        # TiDB Serverless requires TLS 1.2+ encryption
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            ssl=ctx,
            autocommit=True,
            connect_timeout=5,
            cursorclass=pymysql.cursors.DictCursor,
        )
        return conn
    except Exception:
        return None


def init_db() -> bool:
    """
    Creates necessary tables on TiDB Serverless if connected.
    """
    conn = get_db_connection()
    if not conn:
        return False
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(64) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) DEFAULT '',
                    avatar VARCHAR(255) DEFAULT '',
                    role VARCHAR(100) DEFAULT 'Traveler Terdaftar',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS user_ratings (
                    user_id VARCHAR(64) NOT NULL,
                    package_id VARCHAR(64) NOT NULL,
                    rating DECIMAL(3,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, package_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS bookings (
                    id VARCHAR(64) PRIMARY KEY,
                    user_id VARCHAR(64) NOT NULL,
                    package_id VARCHAR(64) NOT NULL,
                    packs INT NOT NULL DEFAULT 1,
                    status VARCHAR(64) NOT NULL DEFAULT 'Confirmation Process',
                    booking_date VARCHAR(64) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """
            )
        conn.close()
        return True
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return False


def save_user(
    user_id: str,
    name: str,
    email: str = "",
    avatar: str = "",
    role: str = "Traveler Terdaftar",
) -> Dict[str, Any]:
    """Saves or updates a user in TiDB Serverless or in-memory fallback."""
    user_data = {
        "id": user_id,
        "name": name,
        "email": email,
        "avatar": avatar or (name[0].upper() if name else "U"),
        "role": role,
    }
    _MEM_USERS[user_id] = user_data

    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO users (id, name, email, avatar, role)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = VALUES(email),
                        avatar = VALUES(avatar),
                        role = VALUES(role);
                    """,
                    (user_id, name, email, user_data["avatar"], role),
                )
            conn.close()
        except Exception:
            pass
    return user_data


def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, email, avatar, role FROM users WHERE id = %s", (user_id,))
                row = cursor.fetchone()
                if row:
                    conn.close()
                    return row
            conn.close()
        except Exception:
            pass
    return _MEM_USERS.get(user_id)


def get_all_users() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, email, avatar, role FROM users ORDER BY created_at ASC")
                rows = cursor.fetchall()
                if rows:
                    conn.close()
                    return rows
            conn.close()
        except Exception:
            pass
    return list(_MEM_USERS.values())


def save_rating(user_id: str, package_id: str, rating: float) -> None:
    if user_id not in _MEM_RATINGS:
        _MEM_RATINGS[user_id] = {}
    _MEM_RATINGS[user_id][package_id] = float(rating)

    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO user_ratings (user_id, package_id, rating)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE rating = VALUES(rating);
                    """,
                    (user_id, package_id, rating),
                )
            conn.close()
        except Exception:
            pass


def get_user_ratings(user_id: str) -> Dict[str, float]:
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT package_id, rating FROM user_ratings WHERE user_id = %s", (user_id,))
                rows = cursor.fetchall()
                if rows:
                    conn.close()
                    return {r["package_id"]: float(r["rating"]) for r in rows}
            conn.close()
        except Exception:
            pass
    return dict(_MEM_RATINGS.get(user_id, {}))


def save_booking(
    user_id: str,
    package_id: str,
    packs: int = 1,
    status: str = "Confirmation Process",
    booking_date: str = "",
    booking_id: Optional[str] = None,
) -> Dict[str, Any]:
    b_id = booking_id or f"bk_{int(time.time() * 1000)}"
    b_date = booking_date or time.strftime("%d %b %Y")
    booking_data = {
        "id": b_id,
        "user_id": user_id,
        "package_id": package_id,
        "packs": packs,
        "status": status,
        "booking_date": b_date,
    }

    if user_id not in _MEM_BOOKINGS:
        _MEM_BOOKINGS[user_id] = []
    _MEM_BOOKINGS[user_id].insert(0, booking_data)

    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO bookings (id, user_id, package_id, packs, status, booking_date)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE status = VALUES(status), packs = VALUES(packs);
                    """,
                    (b_id, user_id, package_id, packs, status, b_date),
                )
            conn.close()
        except Exception:
            pass
    return booking_data


def get_user_bookings(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, user_id, package_id, packs, status, booking_date FROM bookings WHERE user_id = %s ORDER BY created_at DESC",
                    (user_id,),
                )
                rows = cursor.fetchall()
                if rows:
                    conn.close()
                    return rows
            conn.close()
        except Exception:
            pass
    return list(_MEM_BOOKINGS.get(user_id, []))


def is_connected() -> bool:
    """Returns True if TiDB Serverless is live and accessible."""
    conn = get_db_connection()
    if conn:
        try:
            conn.ping(reconnect=False)
            conn.close()
            return True
        except Exception:
            pass
    return False

