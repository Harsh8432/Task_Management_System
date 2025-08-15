import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

const defaultOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  autoIndex: process.env['NODE_ENV'] === 'development',
  autoCreate: process.env['NODE_ENV'] === 'development',
};

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;
  private connectionRetries = 0;
  private readonly maxRetries = 5;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    const uri = process.env['MONGODB_URI'] || process.env['MONGODB_URI_PROD'];
    if (!uri) {
      throw new Error('MongoDB URI not provided in environment variables');
    }

    const config: DatabaseConfig = {
      uri,
      options: {
        ...defaultOptions,
        dbName: this.getDatabaseName(uri),
      },
    };

    try {
      await this.establishConnection(config);
      this.setupEventHandlers();
      this.isConnected = true;
      this.connectionRetries = 0;
      logger.info('Database connected successfully');
    } catch (error) {
      this.handleConnectionError(error as Error, config);
    }
  }

  private async establishConnection(config: DatabaseConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      mongoose.connect(config.uri, config.options)
        .then(() => resolve())
        .catch(reject);
    });
  }

  private setupEventHandlers(): void {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error: Error) => {
      logger.error('Mongoose connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  private async handleConnectionError(error: Error, config: DatabaseConfig): Promise<void> {
    logger.error('Database connection failed:', error.message);
    
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      const delay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
      
      logger.info(`Retrying connection in ${delay}ms (attempt ${this.connectionRetries}/${this.maxRetries})`);
      
      setTimeout(async () => {
        try {
          await this.establishConnection(config);
          this.setupEventHandlers();
          this.isConnected = true;
          this.connectionRetries = 0;
          logger.info('Database reconnected successfully after retry');
        } catch (retryError) {
          this.handleConnectionError(retryError as Error, config);
        }
      }, delay);
    } else {
      logger.error('Max connection retries reached. Exiting...');
      process.exit(1);
    }
  }

  private getDatabaseName(uri: string): string {
    try {
      const url = new URL(uri);
      return url.pathname.slice(1) || 'task-management';
    } catch {
      return 'task-management';
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Received shutdown signal. Closing database connection...');
    
    try {
      await mongoose.connection.close();
      logger.info('Database connection closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionStats(): mongoose.ConnectionStates {
    return mongoose.connection.readyState;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      const db = mongoose.connection.db;
      if (!db) {
        return false;
      }
      
      await db.admin().ping();
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance();

// Export mongoose for direct access if needed
export { mongoose };
