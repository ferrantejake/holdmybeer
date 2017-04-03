import { DataQueries } from '../DataQueries';
import { Document } from '../documents';

/** Interface representing Token model. */
export interface Token extends Document {
    ownerId?: string;
    type: TokenType;
    // Context is never exposed to the consumer.
    context?: Object;
    // Public context is mapped to `context` in it's consumable mapped form.
    publicContext?: Object;
    description?: string;
    expires?: Date;
    testTag?: string;
    ttl?: number;
}

export enum TokenType {
    Auth,
    Session
}

export default class TokenDq extends DataQueries<Token> {
    public constructor() {
        super('holdmybeer_tokens');
    }
}