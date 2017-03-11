import { Document } from './documents';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';
import * as uuid from 'uuid';
import { aws } from '../';
const debug = require('debug')('holdmybeer:dataqueries');
const dynasty = require('dynasty');

export enum ErrorType {
    Unknown,
    DuplicateKey,
    DuplicateAlias,
    SelfSimilarity, // mise en abyme
    EnvironmentBoundary,
    AlreadyClaimed,
    NotFound
}

export interface SelectOneResult<T> { success: boolean; value: T; }
export interface SelectResult<T> { success: boolean; value: T[]; }

export interface FindAndUpdateResult<T> { success: boolean; value: T; isModified: boolean; updatedExisting: boolean; upserted: any; }
/** Represents the expected response from an insert */

export interface InsertResult { success: boolean; isModified: boolean; }
/** Represents the expected response from an update */
export interface UpdateResult { success: boolean; count: number; isModified: boolean; }

/** Represents the expected response from a delete */
export interface DeleteResult { success: boolean; count: number; isModified: boolean; }

/** Represents a generic CRUD result */
export interface CrudResult {
    error?: Error;
    data?: any;
}

export interface TransformMap<T> {
    [key: string]: string | Transform<T> | KeyedTransform<T>;
}

export interface KeyedTransform<T> {
    key: string;
    transform: Transform<T>;
}

export type Transform<T> = (record: T) => any;

/** Class representing base database transactions model. */
export abstract class DataQueries<T extends Document> {
    protected table: any;

    constructor(tableName: string) {
        debug('instantiating table:', tableName);
        this.table = aws.dynamodb().table(tableName);
    }
    /*
     * Creates a mapped version of the record using the specified fields.
     * @param {T} record The record to map.
     * @param {string[]} Fields the fields to use in the mapping.
     * @param {TransformMap<T>} [map] a map of transformations to apply to the field during mapping.
     */
    public static mapRecord<T extends Document>(record: T, fields: string[], map?: TransformMap<T>): { readonly [P in keyof T]?: T[P]} {
        return Object.freeze(
            fields.reduce((prev: any, cur: string) => {
                if (!map || !map.hasOwnProperty(cur)) {
                    // Direct map
                    prev[cur] = record[cur];
                }
                else {
                    // Apply a transform/map
                    const mapKey = map[cur];
                    if (typeof mapKey === 'string') {
                        // Mapping sans transform
                        prev[mapKey] = record[cur];
                    }
                    else if (((map: KeyedTransform<T> | Transform<T>): map is KeyedTransform<T> => map.hasOwnProperty('key'))(mapKey)) {
                        // Keyed transform; use IIFE to avoid making a user-defined type guard function *just* for TypeScript
                        prev[mapKey.key] = mapKey.transform(record);
                    }
                    else
                        prev[cur] = mapKey(record);
                }
                return prev;
            }, {}));
    }

    // Create and return UUID.
    private createUUID(): string {
        // use v4 per: http://stackoverflow.com/a/20342413/2530285
        return uuid.v4();
    }

    // Alters the record being inserted to fit the structure of the expected data.
    protected mapForInsert(record: T) {
        this.formatId(record);
        this.formatCreatedAt(record);
    }

    // Alters the record being inserted to fit the structure of the expected data.
    // Removes fields which will always conflict
    protected mapForUpdate(record: T) {
        delete record.id;
        delete record.createdAt;
    }

    protected formatId(record: T) {
        if (!record) return;
        if (!record.id) record.id = this.createUUID();
    }

    protected formatCreatedAt(record: T) {
        if (!record) return;
        if (!record.createdAt || !(typeof record.createdAt === 'string'))
            record.createdAt = new Date(Date.now()).toISOString() as any;
    }

    /**
     * Wraps a CRUD Promise in a Promise without the Read Promise.
     * @param {Promise<InsertResult>} Promise - The insert Promise.
     * @return {Promise<CrudResult>} The insert result.
     */
    protected cPromise(promise: Promise<InsertResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => promise.then(resolve).catch(resolve));
    }

    /**
     * Wraps an update Promise in a Promise.
     * @param {Promise<UpdateResult>} Promise - The update Promise.
     * @return {Promise<CrudResult>} The update result.
     */
    protected uPromise(promise: Promise<UpdateResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => promise.then(resolve).catch(resolve));
    }

    /**
     * Wraps a delete Promise in a Promise.
     * @param {Promise<DeleteResult>} Promise - The delete Promise.
     * @return {Promise<CrudResult>} The delete result.
     */
    protected dPromise(promise: Promise<DeleteResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => promise.then(resolve).catch(reject));
    }

    // Insert a document
    public insert(record: T): Promise<InsertResult> {
        // There are 3 potential outcomes to an insert:
        // 1: Insert successfull:   success:true, isModified:true
        // 2: Record exists:        success:true, isModified:false
        // 3: Insert failure:       reject, error

        return new Promise<InsertResult>((resolve, reject) => {
            this.mapForInsert(record);
            const options = { ConditionExpression: 'attribute_not_exists(id)' };
            this.table.insert(record, options)
                .then(() => resolve({ success: true, isModified: true }))
                .catch((error: Error) => {
                    if (error && error.message === 'The conditional request failed')
                        return resolve({ success: true, isModified: false });
                    else reject(error);
                });
        });
    };

    /**
     * Retrieves a record by the specified ID.
     * @param {string} id - The ID of the record.
     * @return {Promise<T[]>} A record Promise.
     */
    public getById(id: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.table.find(id)
                .then((document: T) => resolve(this.map(document) as T))
                .catch(reject);
        });
    };

    /**
     * Retrieves records by the specified IDs.
     * @param {string[]} ids - The IDs of the desired records.
     * @return {Promise<T[]>} A Promise of records.
     */
    public getByIds(ids: string[]): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            this.table.batchFind(ids)
                .then((documents: T[]) => resolve(documents.map<any>(document => this.map(document))))
                .catch(reject);
        });
    };

    /**
     * Updates a record by the specified ID.
     * @param {string} id - The ID of the records.
     * @return {Promise<void>} An empty Promise.
     */
    public updateById(id: string, fields: Object): Promise<UpdateResult> {
        // There are 3 potential outcomes to an insert:
        // 1: Update successfull:   success:true, count:n, isModified: boolean
        // 2: Record DNE:           success:true, count: 0, isModified: false
        // 3: Update failure:       reject, error

        const options = { ReturnValues: 'UPDATED_OLD', ConditionExpression: 'attribute_exists(id)' };
        return new Promise<UpdateResult>((resolve, reject) => {
            this.table.update(id, fields, options)
                .then((response: any) => {
                    const stats = this.updateStats(response, fields);
                    resolve({ success: true, count: stats.count, isModified: stats.isModified });
                })
                .catch((error: Error) => {
                    if (error && error.message === 'The conditional request failed')
                        return resolve({ success: true, count: 0, isModified: false });
                    else reject(error);
                });
        });
    };

    // Gather statistics on update result (consumed in an UpdateResult)
    public updateStats(old: Object, update: any): any {
        const stats = {
            count: 0,
            isModified: false
        };
        Object.keys(old).forEach(key => {
            if (old[key] !== update[key]) {
                stats.count++;
                stats.isModified = true;
            }
        });
        return stats;
    }

    // Worth nothing this system does not `ensure` that a delete has actually
    // taken place, but assumes if there was no error that the delete was successfull.
    public deleteById(id: string): Promise<DeleteResult> {
        return new Promise<DeleteResult>((resolve, reject) => {
            this.table.remove(id)
                // Because we do not ensure a deletion, return undefined for modification and count.
                .then(() => resolve({ count: undefined, isModified: undefined, success: true } as DeleteResult))
                .catch(reject);
        });
    };

    /**
     * Maps a database record to a consumable structure.
     * @param {T} record - The database record.
     * @return {Object} The refined object.
     */
    public map(record: T): Object {
        return record;
    }

    public mapRecord(record: T, fields: string[], map?: TransformMap<T>): { readonly [P in keyof T]?: T[P]} {
        return DataQueries.mapRecord<T>(record, fields, map);
    }
};