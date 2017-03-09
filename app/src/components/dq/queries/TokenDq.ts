import { DataQueries } from '../DataQueries';
import { Document } from '../documents';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

/** Interface representing User model. */
export interface Token extends Document {
    first: string;
    last: string;
    nick: string;
};

export class TokenDq extends DataQueries<Token> {
    public constructor() {
        super('holdmybeer_tokens');
    }

    public map(record: Token): { readonly [P in keyof Token]?: Token[P]; } {
        return this.mapRecord(
            record,
            ['_id', 'createdAt', 'userId', 'scope', 'accessToken'],
            { _id: 'id' });
    }
}