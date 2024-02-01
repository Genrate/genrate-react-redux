import { useConnectorCore } from '@genrate/react';
import { KeyValue } from '@genrate/react/lib/src/override';
import { Override } from '@genrate/react/lib/src/override/override';
import { Store } from './store';
import { Selector } from '@reduxjs/toolkit';

import Model, { set_override, useOverrideHooks } from './redux';
import { ModelType } from '@genrate/redux';
import React from 'react';
import { rebuild } from '@genrate/react/lib/src/override/component';

export type SelectorFn<D extends KeyValue<unknown>> = (data: D) => ModelType<unknown> | Selector;

export type SelectorType<T> = T extends ModelType<unknown> ? T['$$type'] : T extends Selector ? ReturnType<T> : never;

type SelectorFnValue<S extends SelectorFn<any>> = SelectorType<ReturnType<S>>;
type SelectorValues<S extends KeyValue<SelectorFn<any>>> = {
  [K in keyof S]: S[K] extends SelectorFn<any> ? SelectorFnValue<S[K]> : never;
};

export type HookFn<D extends KeyValue<unknown>, R = any> = (data: D) => R;

type PopFirst<T> = T extends readonly [any, ...infer U] | [any, ...infer U] ? U : never;

type SplitKey<K extends string, R extends readonly any[] | any[]> = K extends `${infer T}|${infer U}`
  ? Record<T, R[0]> & SplitKey<U, PopFirst<R>>
  : R extends readonly any[] | any[]
    ? Record<K, R[0]>
    : Record<K, R>;

export type HookFnResultArray<H extends KeyValue<HookFn<any>>> = {
  [K in keyof H]: K extends string
    ? ReturnType<H[K]> extends readonly any[] | any[]
      ? SplitKey<K, ReturnType<H[K]>>
      : Record<K, ReturnType<H[K]>>
    : never;
};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type HookFnResults<H extends KeyValue<HookFn<any>>, A = HookFnResultArray<H>> = UnionToIntersection<A[keyof A]>;

Override.setStore(Store);

type Restrict<T, M> = keyof T extends keyof M ? M & { [K in keyof T]?: never } : M;

type Data<Local, Selectors, Hooks> = {
  local?: Local;
  selectors?: Restrict<Local, Selectors>;
  hooks?: Restrict<Local & Selectors, Hooks>;
};

export const GenrateHooks = React.memo(({ connectorId }: { connectorId: string }) => {
  useOverrideHooks(connectorId);
  return null;
});

export function useData<
  Local extends KeyValue<unknown>,
  Selectors extends KeyValue<SelectorFn<Local>>,
  Hooks extends KeyValue<HookFn<Local & SelectorValues<Selectors>>>,
>(data?: Data<Local, Selectors, Hooks>) {
  const connector = useConnectorCore<Local, Local & SelectorValues<Selectors> & HookFnResults<Hooks>>(data?.local);

  if (data?.selectors) {
    set_override(connector.id, data.selectors);
  }

  if (data?.hooks) {
    const keys = Object.keys(data.hooks);
    const keyMap: Record<string, true> = {};
    keys.forEach((k) => {
      if (k.indexOf('|') > -1) {
        k.split('|').forEach((s) => {
          keyMap[s] = true;
        });
      } else {
        keyMap[k] = true;
      }
    });

    set_override(connector.id, { ...data.hooks, $$keyMap: keyMap }, 'hooks');
  }

  return {
    ...connector,
    view: (...viewParams: Parameters<typeof connector.view>) => {
      return [
        rebuild(GenrateHooks, { key: `hook-${connector.id}`, connectorId: connector.id }),
        connector.view(...viewParams),
      ];
    },
  };
}

export function reducer() {
  return Model.reducer();
}
