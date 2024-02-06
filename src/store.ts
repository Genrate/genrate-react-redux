import { OverrideStore } from '@genrate/react/lib/src/override/override';
import Model, { getByExceptKeys, getSelectors, get_selector_keys, is_selectors_exists } from './model';
import { useEffect, useState } from 'react';
import { store } from '@genrate/react/lib/src/store/store';
import { KeyValue } from '@genrate/react/lib/src/override';

const hooksStore = { ...store };

export const Store: OverrideStore = {
  useInit(connectorId, data) {
    const state = Model.useGetAll(connectorId);
    const set = Model.useSet();
    const unset = Model.useUnset();
    const setValue = Model.useSetValue();

    if (state == undefined && Object.keys(data ?? {}).length) {
      set([connectorId, data]);
    }

    useEffect(() => {
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
        is_selectors_exists(connectorId, vk) ? selectKeys.push(vk) : stateKeys.push(vk);
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
    if (!key) return [null, () => {}];

    const data = Model.useGetByKey(connectorId, key);
    const setValue = Model.useSetValue();

    return [
      data ?? '',
      (value: unknown) => {
        setValue([connectorId, key, value]);
      },
    ];
  },
  useHooks: (connectorId: string, keys?: string[] | undefined) => {
    const hookId = `${connectorId}--$$hooks`;

    const values: KeyValue = {};

    const states: KeyValue = {};

    const subKeys: string[] = [];
    if (keys) {
      for (const key of keys) {
        const result = hooksStore.get(hookId, key);

        if (typeof result != 'function') {
          const [data, set] = (() => useState(result))();
          states[key] = { data, set };
          subKeys.push(key);
        } else {
          values[key] = result;
        }
      }
    }

    for (const key in states) {
      values[key] = states[key]?.data;
    }

    useEffect(() => {
      if (!subKeys?.length) return;

      const subs = subKeys?.map((key) =>
        hooksStore.subscribe(hookId, key, (val) => {
          states[key]?.set(val);
        })
      );

      return () => {
        subs?.map((sub) => sub.unsubscribed());
      };
    }, []);

    return values;
  },
  useHooksInit: (connectorId: string) => {
    const hookId = `${connectorId}--$$hooks`;
    const state = Model.useGetAll(connectorId);
    const selectors = getSelectors.useSelect(connectorId, true);

    hooksStore.init(hookId, {});

    return [
      { ...state, ...selectors },
      (key, value, init: boolean = true) => {
        hooksStore.set(hookId, key, value, { emit: !init });
      },
    ];
  },
};
