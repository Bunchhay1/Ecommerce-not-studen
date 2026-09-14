-- Initialize microservice databases
SELECT 'CREATE DATABASE auth_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec
SELECT 'CREATE DATABASE user_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user_db')\gexec
SELECT 'CREATE DATABASE catalog_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'catalog_db')\gexec
SELECT 'CREATE DATABASE cart_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cart_db')\gexec
SELECT 'CREATE DATABASE inventory_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'inventory_db')\gexec
SELECT 'CREATE DATABASE order_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_db')\gexec
SELECT 'CREATE DATABASE payment_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_db')\gexec
SELECT 'CREATE DATABASE shipping_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'shipping_db')\gexec
SELECT 'CREATE DATABASE pricing_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pricing_db')\gexec
SELECT 'CREATE DATABASE review_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'review_db')\gexec
SELECT 'CREATE DATABASE notification_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notification_db')\gexec
SELECT 'CREATE DATABASE seller_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'seller_db')\gexec
SELECT 'CREATE DATABASE seller_marketplace_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'seller_marketplace_db')\gexec
SELECT 'CREATE DATABASE recommendation_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'recommendation_db')\gexec
SELECT 'CREATE DATABASE admin_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'admin_db')\gexec
