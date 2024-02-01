import { OverrideStore } from '@genrate/react/lib/src/override/override';
import ReduxModel, { getByExceptKeys, getSelectors, get_overidde_keys, is_override_exists, useHooks } from './redux';
import { useEffect } from 'react';

export const Store: OverrideStore = {
  useInit(connectorId, data) {
    const set = ReduxModel.useSet();
    const unset = ReduxModel.useUnset();
    const setValue = ReduxModel.useSetValue();

    useEffect(() => {
      set([connectorId, data]);

      return () => {
        unset(connectorId);
      };
    }, []);

    return [data, (key, value) => setValue([connectorId, key, value])];
  },
  useData(connectorId, propKeys, subKeys, exceptKeys) {
    let selectKeys: string[] = [];
    const stateKeys: string[] = [];
    const hookKeys: string[] = [];

    if (subKeys) {
      for (const vk of subKeys) {
        if (is_override_exists(connectorId, vk, 'hooks')) {
          hookKeys.push(vk);
        } else if (is_override_exists(connectorId, vk)) {
          selectKeys.push(vk);
        } else {
          stateKeys.push(vk);
        }
      }
    }

    if (subKeys === undefined) {
      selectKeys = get_overidde_keys(connectorId);
    }

    const state = getByExceptKeys.useSelect(connectorId, stateKeys, exceptKeys);
    const redux = getSelectors.useSelect(connectorId, selectKeys);

    const hooks = useHooks(connectorId, hookKeys);

    const data = { ...state, ...redux, ...hooks };

    const props: Record<string, any> = { ...(exceptKeys !== undefined ? state : {}) };
    if (propKeys) {
      for (const prop of propKeys) {
        props[prop] = data[prop];
      }
    }

    return [props, data];
  },
  useModel(connectorId: string, key?: string | undefined): [value: unknown, (value: unknown) => void] {
    if (!key) return [null, () => {}];

    const data = ReduxModel.useGetByKey(connectorId, key);
    const setValue = ReduxModel.useSetValue();

    return [
      data ?? '',
      (value: unknown) => {
        setValue([connectorId, key, value]);
      },
    ];
  },
};
