export default () => ({
  port: parseInt(process.env.PORT, 10) || 8089,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5440/shipping_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6387,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9100').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'shipping-service',
    groupId: process.env.KAFKA_GROUP_ID || 'shipping-service-group',
    topic: process.env.KAFKA_TOPIC_SHIPPING_EVENTS || 'shipping.events',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretjwtkeyforidentityservice2026ecommerceplatform',
  },
  carriers: {
    defaultCarrier: process.env.SHIPPING_DEFAULT_CARRIER || 'LOCAL',
    dhl: {
      apiKey: process.env.DHL_API_KEY || 'mock_dhl_key',
      webhookSecret: process.env.DHL_WEBHOOK_SECRET || 'whsec_dhl_mock',
    },
    fedex: {
      apiKey: process.env.FEDEX_API_KEY || 'mock_fedex_key',
      webhookSecret: process.env.FEDEX_WEBHOOK_SECRET || 'whsec_fedex_mock',
    },
    ups: {
      apiKey: process.env.UPS_API_KEY || 'mock_ups_key',
      webhookSecret: process.env.UPS_WEBHOOK_SECRET || 'whsec_ups_mock',
    },
  },
});
