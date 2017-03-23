import { DataQueries } from '../DataQueries';
import { Document } from '../documents';

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
}