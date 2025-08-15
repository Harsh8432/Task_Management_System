import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserPreferences } from '../types';

export interface UserDocument extends Document {
  emailVerificationExpires?: Date;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  profilePicture?: string;
  preferences?: UserPreferences;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date | undefined;
    lastLoginAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  updateLastLogin(): Promise<void>;
  isAdmin(): boolean;
  isManager(): boolean;
  hasPermission(permission: string): boolean;
}

export interface UserModel extends Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
  createUser(userData: Partial<UserDocument>): Promise<UserDocument>;
  updateUserProfile(userId: string, updates: Partial<UserDocument>): Promise<UserDocument>;
  deactivateUser(userId: string): Promise<UserDocument>;
  getActiveUsers(): Promise<UserDocument[]>;
  getUserStats(): Promise<any>;
}

// User preferences schema
const userPreferencesSchema = new Schema<UserPreferences>({
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'auto'
  },
  language: {
    type: String,
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  weeklyDigest: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// User schema
const userSchema = new Schema<UserDocument>({
  emailVerificationExpires: {
    type: Date
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'user', 'guest'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  profilePicture: {
    type: String
  },
  preferences: {
    type: userPreferencesSchema,
    default: () => ({})
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    select: false
  },
  passwordChangedAt: {
    type: Date
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function(this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
userSchema.virtual('displayName').get(function(this: UserDocument) {
  return this.firstName;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ 'preferences.language': 1 });
userSchema.index({ 'preferences.timezone': 1 });

// Compound indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env['BCRYPT_ROUNDS'] || '12');
    this['password'] = await bcrypt.hash(this['password'], saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    this['passwordChangedAt'] = new Date();
  }
  next();
});

// Instance method to compare password
userSchema.methods['comparePassword'] = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this['password']);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
}
// Instance method to check if user is admin
userSchema.methods['isAdmin'] = function(): boolean {
  return this['role'] === 'admin';
};

// Instance method to check if user is manager
userSchema.methods['isManager'] = function(): boolean {
  return this['role'] === 'manager' || this['role'] === 'admin';
};

// Instance method to check permissions
userSchema.methods['hasPermission'] = function(permission: string): boolean {
  if (this['role'] === 'admin') return true;
  if (this['role'] === 'manager' && ['read', 'write'].includes(permission)) return true;
  if (this['role'] === 'user' && permission === 'read') return true;
  return false;
};

// Instance method to update last login
userSchema.methods['updateLastLogin'] = async function(): Promise<void> {
  this['lastLoginAt'] = new Date();
  this['loginAttempts'] = 0;
  this['lockUntil'] = undefined;
  await this['save']();
};

// Static method to find user by email
userSchema.statics['findByEmail'] = function(email: string): Promise<UserDocument | null> {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Static method to create user
userSchema.statics['createUser'] = async function(userData: Partial<UserDocument>): Promise<UserDocument> {
  const user = new this(userData);
  return await user.save();
};

// Static method to update user profile
userSchema.statics['updateUserProfile'] = async function(
  userId: string, 
  updates: Partial<UserDocument>
): Promise<UserDocument> {
  const user = await this.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};

// Static method to deactivate user
userSchema.statics['deactivateUser'] = async function(userId: string): Promise<UserDocument> {
  const user = await this.findByIdAndUpdate(
    userId,
    { 
      $set: { 
        isActive: false,
        deactivatedAt: new Date()
      }
    },
    { new: true }
  );
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};

// Static method to get active users
userSchema.statics['getActiveUsers'] = function(): Promise<UserDocument[]> {
  return this.find({ isActive: true }).select('-password');
};

// Static method to get user statistics
userSchema.statics['getUserStats'] = async function(): Promise<any> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
        usersByRole: {
          $push: {
            role: '$role',
            count: 1
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalUsers: 1,
        activeUsers: 1,
        verifiedUsers: 1,
        usersByRole: 1
      }
    }
  ]);
  
  return stats[0] || {};
};

// Add passwordChangedAt field for JWT token validation
userSchema.add({
  passwordChangedAt: Date
});

// Export the model
export const User = mongoose.model<UserDocument, UserModel>('User', userSchema);
