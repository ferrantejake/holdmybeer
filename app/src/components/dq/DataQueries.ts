import { Document } from './DataQueries';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';
import * as uuid from 'uuid';
import { aws } from '../';

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
export interface InsertResult { success: boolean; }
export interface UpdateResult { success: boolean; count: number; isModified: boolean; isScanned: boolean; }
export interface DeleteResult { success: boolean; count: number; isModified: boolean; }

export interface CrudResult {
    error?: Error;
    data?: any;
}

export interface Alias {
    _id: string;
    alias: string;
    scopeId: string;
    objectType: string;
    objectId: string;
}

export interface TransformMap<T> {
    [key: string]: string | Transform<T> | KeyedTransform<T>;
}

export interface KeyedTransform<T> {
    key: string;
    transform: Transform<T>;
}

export type Transform<T> = (record: T) => any;

export interface Document {
    id?: string;
    [k: string]: any;
}

export abstract class DataQueries<T extends Document> {

    // protected indexNames: string[];
    // protected fieldNames: string[];
    protected tableName: string;

    /*
     * Creates a mapped version of the record using the specified fields
     * @param {T} record The record to map
     * @param {string[]} Fields the fields to use in the mapping
     * @param {TransformMap<T>} [map] a map of transformations to apply to the field during mapping
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

    /*
     * Creates a mapped version of the record using the specified fields
     * @param {T} record The record to map
     * @param {string[]} Fields the fields to use in the mapping
     * @param {TransformMap<T>} [map] a map of transformations to apply to the field during mapping
     */

    private createUUID() {
        // use v4 per: http://stackoverflow.com/a/20342413/2530285
        const x = uuid.v4();
    }

    /**
     * CRUD without the Read Promise
     */
    protected cPromise(promise: Promise<InsertResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => {
            promise.then(value => {
                resolve(value);
            }).catch(error => {
                resolve(error);
            });
        });
    }

    /**
     * Delete Promise
     */
    protected dPromise(promise: Promise<DeleteResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => {
            promise.then(resolve).catch(reject);
        });
    }

    /**
     * Update Promise
     */
    protected uPromise(promise: Promise<UpdateResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => {
            promise.then(resolve).catch(error => {
                resolve(error);
            });
        });
    }

    /**
     * Find and update Promise
     */
    // protected fuPromise(promise: Promise<FindAndUpdateResult<T>>): Promise<CrudResult> {
    //     return new Promise((resolve, reject) => {
    //         promise.then(resolve).catch(error => {
    //             resolve(error);
    //         });
    //     });
    // }

    public getById(id: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const p: DynamoDB.GetParam = {
                TableName: this.tableName,
                Key: { '_id': id }
            };
            console.log(p);
            aws.client().get(p, (error: Error, users: any) => {
                if (error) reject(error);
                // else ();
                console.log(error);
                console.log('users');
                console.log(users);
            });
        });
    };

    public parseGetResponse(response: any): T {
        return null;
    }

    public map(record: T): Object {
        return record;
    }

    public mapRecord(record: T, fields: string[], map?: TransformMap<T>): { readonly [P in keyof T]?: T[P]} {
        return DataQueries.mapRecord<T>(record, fields, map);
    }

    // public getByIds(ids: string[]): Promise<T[]> {
    //     return this.defaultCollection.find({ _id: { $in: ids.map(id => this.formatId(id)) } });
    // }

    // public deleteById(id: string): Promise<CrudResult> {
    //     return this.dPromise(this.defaultCollection.deleteOne({ _id: this.formatId(id) }));
    // }

    // public updateById(id: string, modifications: Object): Promise<CrudResult> {
    //     if (Object.keys(modifications).length === 0)
    //         return Promise.resolve({ success: true, isScanned: true });
    //     return this.uPromise(this.defaultCollection.updateOne({ _id: this.formatId(id) }, { $set: modifications }));
    // }

    // public deleteByTestTag(testTag: string): Promise<CrudResult> {
    //     return this.dPromise(this.defaultCollection.deleteMany({ testTag }));
    // }

    // helpers
    // public fillMissing(arr: any[], field: string, idField?: string): Promise<void> {
    //     return new Promise<void>((resolve, reject) => {
    //         const missingIds: string[] = [];
    //         // get ids for records we don't have
    //         arr.forEach(item => {
    //             if (typeof (item[idField || field]) === 'string') {
    //                 missingIds.push(this.formatId(item[idField || field]));
    //             }
    //         });
    //         this.getByIds(missingIds).then(missing => {
    //             // fill in the records we don't have
    //             missing.forEach(record => {
    //                 for (const item of arr) {
    //                     if (this.unmapId(item[idField || field]) === (<any>record)._id.toString()) {
    //                         item[field] = record;
    //                         break;
    //                     }
    //                 }
    //             });
    //             resolve();
    //         });
    //     });
    // }
}