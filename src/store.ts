import { OverrideStore } from '@genrate/react/lib/src/override/override';
import Model, { getByExceptKeys, getSelectors, get_selector_keys, is_selectors_exists } from './model';
import { useEffect, useReducer } from 'react';
import { store } from '@genrate/react/lib/src/store';
import { KeyValue } from '@genrate/react/lib/src/override';

export const Store: OverrideStore = {
  useInit(connectorId, data) {
    const set = Model.useSet();
    const unset = Model.useUnset();
    const setValue = Model.useSetValue();

    useEffect(() => {
      set([connectorId, data]);

      return () => {
        unset(connectorId);
      };
    }, []);

    return [data, (key, value) => setValue([connectorId, key, value])];
  },
  useState(connectorId, subKeys, exceptKeys) {
    let selectKeys: string[] = [];
    const stateKeys: string[] = [];

    if (subKeys) {
      for (const vk of subKeys) {
        is_selectors_exists(connectorId, vk) 
          ? selectKeys.push(vk)
          : stateKeys.push(vk);
      }
    }

    if (subKeys === undefined) {
      selectKeys = get_selector_keys(connectorId);
    }

    const state = getByExceptKeys.useSelect(connectorId, stateKeys, exceptKeys);
    const selectors = getSelectors.useSelect(connectorId, selectKeys);

    return { ...state, ...selectors };
  },
  useModel(connectorId: string, key?: string | undefined): [value: unknown, set: (value: unknown) => void] {
    if (!key) return [null, () => { } ];

    const data = Model.useGetByKey(connectorId, key);
    const setValue = Model.useSetValue();

    return [
      data ?? '',
      (value: unknown) => {
        setValue([connectorId, key, value]);
      },
    ];
  },
  useHooks: (connectorId: string, keys?: string[] | undefined, except?: string[] | undefined) => {
    const hookId = `${connectorId}--hooks`;
    const [, forceUpdate] = useReducer((x) => x + 1, 0);

    useEffect(() => {
      if (!keys?.length) return;

      const subs = keys?.map((key) => store.subscribe(hookId, key, () => forceUpdate()));

      return () => {
        subs?.map((sub) => sub.unsubscribed());
      };
    }, [keys]);

    const values: KeyValue = {};

    if (keys) {
      for (const key of keys) {
        values[key] = store.get(hookId, key);
      }
    }

    return values;
  },
  useHooksInit: (connectorId: string) => {
    const hookId = `${connectorId}--hooks`;
    const state = Model[connectorId].useAll();
    const selectors = getSelectors.useSelect(connectorId, true);

    return [
      { ...state, ...selectors },
      (key, value) => {
        store.set(hookId, key, value);
      }
    ]
  }
};
