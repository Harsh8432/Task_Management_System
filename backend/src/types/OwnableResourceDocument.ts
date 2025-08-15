import { Document } from 'mongoose';

export interface OwnableResourceDocument extends Document {
  assignedToId?: string;
  createdById?: string;
}
