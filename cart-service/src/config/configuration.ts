export default () => ({
  port: parseInt(process.env.PORT, 10) || 8085,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'cart-service',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5436/cart_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6383,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    ttl: parseInt(process.env.CART_CACHE_TTL_SECONDS, 10) || 3600,
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9096').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'cart-service',
    groupId: process.env.KAFKA_GROUP_ID || 'cart-service-group',
    cartEventsTopic: process.env.KAFKA_CART_EVENTS_TOPIC || 'cart.events',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-key-change-in-production-never-commit-real-secrets',
  },
  services: {
    catalogUrl: process.env.CATALOG_SERVICE_URL || 'http://localhost:8083',
    inventoryUrl: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8086',
  },
});
