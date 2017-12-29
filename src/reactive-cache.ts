import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/share';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { objectKeyToStringKey } from './object-key-to-string-key';
import { Cache } from './reactive-cache-interface';

const KEY_TUPLE_INDEX = 0;
const OBSERVABLE_TUPLE_INDEX = 1;
const SUBSCRIPTION_TUPLE_INDEX = 2;

export class ReactiveCache<TKey, TValue> implements Cache<TKey, TValue> {

  private _underlyingCache: { [key: string]: [ TKey, Observable<TValue>, Subscription ] } = {};

  constructor(
    private _retrieveValue: (key: TKey) => Observable<TValue>,
    private _stringKeyFrom: (key: TKey) => string = objectKeyToStringKey,
  ) {
  }

  size(): number {
    return Object
      .keys(this._underlyingCache)
      .length;
  }

  keys(): TKey[] {
    return Object
      .keys(this._underlyingCache)
      .map(stringKey => this._underlyingCache[stringKey][KEY_TUPLE_INDEX]);
  }

  get(key: TKey): Observable<TValue> {
    const stringKey = this._stringKeyFrom(key);

    if (this._isStringKeyInUse(stringKey) === false) {
      this._cacheAndSubscribe(key, stringKey, this._retrieveValue(key));
    }

    return this._underlyingCache[stringKey][OBSERVABLE_TUPLE_INDEX];
  }

  private _isStringKeyInUse(stringKey: string): boolean {
    return Object.keys(this._underlyingCache).indexOf(stringKey) >= 0;
  }

  private _createCachingObservable(prototypeObservable: Observable<TValue>): Observable<TValue> {
    // Caching Observables described here: https://goo.gl/6Bb7zY
    return prototypeObservable
      .share()
      .publishReplay(1)
      .refCount();
  }

  private _cacheAndSubscribe(key: TKey, stringKey: string, observable: Observable<TValue>): void {
    const cachingObservable = this._createCachingObservable(observable);
    this._underlyingCache[stringKey] = [key, cachingObservable, cachingObservable.subscribe()];
  }

  set(key: TKey, value: Observable<TValue>): void {
    const stringKey = this._stringKeyFrom(key);

    if (this._isStringKeyInUse(stringKey)) {
      this.delete(key);
    }

    this._cacheAndSubscribe(key, stringKey, value);
  }

  delete(key: TKey): void {
    this._reset(this._stringKeyFrom(key));
  }

  deleteAll(): void {
    Object
      .keys(this._underlyingCache)
      .forEach(stringKey => this._reset(stringKey));
  }

  private _reset(stringKey: string): void {
    const [key, observable, subscription] = this._underlyingCache[stringKey];
    subscription.unsubscribe();
    delete this._underlyingCache[stringKey];
  }

}
