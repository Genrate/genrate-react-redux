import { Selector } from '@reduxjs/toolkit';
import { useConnector } from '@genrate/react';
import { KeyValue } from '@genrate/react/lib/src/override';
import { HookFn, Override } from '@genrate/react/lib/src/override/override';
import { ModelType } from '@genrate/redux';

import { Store } from './store';
import Model, { set_selectors } from './model';

export type SelectorFn<D extends KeyValue> = (data: D) => ModelType<unknown> | Selector;

export type SelectorType<T> = T extends ModelType<unknown> ? T['$$type'] : T extends Selector ? ReturnType<T> : never;

type SelectorFnValue<S extends SelectorFn<any>> = SelectorType<ReturnType<S>>;
type SelectorValues<S extends KeyValue<SelectorFn<any>>> = {
  [K in keyof S]: S[K] extends SelectorFn<any> ? SelectorFnValue<S[K]> : never;
};

Override.setStore(Store);

type Restrict<T, M> = keyof T extends keyof M ? M & { [K in keyof T]?: never } : M;

type Data<State, Selectors, Hooks> = {
  state?: State;
  selectors?: Restrict<State, Selectors>;
  hooks?: Restrict<State & Selectors, Hooks>;
};

export function useData<
  State extends KeyValue,
  Selectors extends KeyValue = KeyValue<SelectorFn<State>>,
  HookState extends KeyValue = State & SelectorValues<Selectors>,
  Hooks extends KeyValue = KeyValue<HookFn<HookState>>,
>(data?: Data<State, Selectors, Hooks>) {
  const connector = useConnector<State, HookState, Hooks>(data);

  if (data?.selectors) {
    set_selectors(connector.id, data.selectors);
  }

  return connector;
}

export function reducer() {
  return Model.reducer();
}
