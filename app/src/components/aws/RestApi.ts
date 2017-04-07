import * as express from 'express';
import { rest } from '../../utils';
import * as request from 'request';

export enum Method {
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
}
export default class RestAPI {
    private baseUrl: string;
    private options: any;

    constructor(baseUrl: string, baseOptions: any) {
        this.baseUrl = baseUrl;
        this.options = baseOptions;
    }

    public endpoint(route: string, method?: string): (options: any) => Promise<Object> {
        return function (options): Promise<rest.Response> {
            Object.apply(this.options, options);
            return new Promise<Object>((resolve, reject) => {
                this.mapMethodType(method)(route, this.options, (error: Error, response: request.RequestResponse, body: any) => {
                    if (response && response.statusCode === 200)
                        try { resolve(rest.Response.fromSuccess(JSON.parse(body))); }
                        catch (error) { reject(error); }
                    else reject(error);
                });
            });
        };
    }

    private mapMethodType(method: Method): (uri: string, options: request.CoreOptions, callback: request.RequestCallback) => request.Request {
        switch (method) {
            case Method.DELETE: return request.delete;
            case Method.PUT: return request.put;
            case Method.POST: return request.post;
            case Method.PATCH: return request.patch;
            default: return request.get;
        }
    }
};