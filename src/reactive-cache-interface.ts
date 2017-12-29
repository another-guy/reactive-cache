import { Observable } from 'rxjs/Observable';

export interface Cache<TKey, TValue> {
  size(): number;
  keys(): TKey[];
  get(key: TKey): Observable<TValue>;
  set(key: TKey, value: Observable<TValue>): void;
  delete(key: TKey): void;
  deleteAll(): void;
}
