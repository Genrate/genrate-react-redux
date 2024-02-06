'use client';

import React, { useState } from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

import { arg, fetch, model, select } from '@genrate/redux';
import { configureStore, PayloadAction } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { reducer, useData } from '../src';

const testState = {
  word: '',
  list: [{ num: 1 }, { num: 2 }, { num: 3 }],
};

const testModel = model('test', testState, {
  setWord(state, action: PayloadAction<string>) {
    state.word = action.payload;
  },
});

const filterBy = select([testModel.list], [arg<number>(1)], (list, num) => {
  return list.filter((l) => l.num == num);
});

type Post = {
  id: string;
  content: string;
};

const { api, get, put } = fetch('posts', 'https://api.example.com/');

const PostAPI = api({
  getAll: get<Post[]>(() => `posts`),
  updateOne: put<Post, { id: string; content: string }>(({ id, content }) => ({
    url: `posts/${id}`,
    body: { content },
  })),
});

export const store = configureStore({
  reducer: {
    ...reducer(),
    ...testModel.reducer(),
    [PostAPI.reducerPath]: PostAPI.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(PostAPI.middleware),
});

const Template = ({ word = 'test', phrase = 'sample' }) => {
  return (
    <div>
      <button></button>
      <span>
        {word} {phrase}
      </span>
    </div>
  );
};

const TestOutput = ({ test = 'sample' }) => (
  <>
    <span>{test}</span>
  </>
);

const TemplateInput = () => {
  return (
    <div>
      <input name="test" />
      <button />
      <TestOutput />
      <ul>
        <li></li>
      </ul>
    </div>
  );
};

const Loading = ({ title = 'loading...' }) => <p>{title}</p>;

const TestComponent = () => {
  const { view, set } = useData({
    state: {
      phrase: 'yeah',
    },
    selectors: {
      word: () => testModel.word,
    },
    hooks: {},
  });

  const setWord = testModel.useSetWord();

  return view(Template, {
    button: () => () => ({
      onClick: () => {
        setWord('hello'), set('phrase', 'world');
      },
    }),
  });
};

const TestInput = () => {
  const { view, model, pass, each } = useData({
    state: {
      test: '',
    },
    selectors: {
      list: () => testModel.list,
      list2:
        ({ test }) =>
        (state) =>
          filterBy(state, test == 'write' ? 1 : 0),
    },
  });

  return view(TemplateInput, {
    input: model(),
    TestOutput: pass(true),
    li: each(({ list, list2 }) => () => {
      return (list2.length ? list2 : list).map((l) => ({ title: l.num }));
    }),
  });
};

const TestHooks = () => {
  const { view } = useData({
    selectors: {
      word: () => testModel.word,
    },
    hooks: {
      'phrase|setPhrase': () => useState('sample'),
    },
  });

  const setWord = testModel.useSetWord();

  return view(Template, {
    button:
      ({ setPhrase }) =>
      () => {
        return {
          onClick: () => {
            setWord('hi');
            setPhrase('world');
          },
        };
      },
  });
};

const TestAPI = () => {
  const { view, each, model, attach } = useData({
    state: {
      input: [] as string[],
    },
    hooks: {
      posts: () => PostAPI.useGetAllQuery(),
      'updatePost|updateStatus': () => PostAPI.useUpdateOneMutation(),
    },
  });

  return view(TemplateInput, {
    input: each(
      ({ posts }) =>
        () =>
          posts?.data?.map((p) => model(`input.${p.id}`)) ?? [
            attach(Loading, { title: posts?.isLoading ? 'Loading posts...' : 'Empty posts' }),
          ]
    ),
    TestOutput:
      ({ posts }) =>
      () => ({ test: posts?.status }),
    button:
      ({ updatePost, updateStatus, input }) =>
      () => {
        return {
          onClick: () => {
            const id = 2;
            updatePost({ id: `${id}`, content: input[id - 1] });
          },
          disabled: updateStatus?.isLoading,
          status: updateStatus?.status,
        };
      },
  });
};

afterEach(cleanup);

describe('index', () => {
  describe('useData', () => {
    it('should render the component', () => {
      const { container } = render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      expect(container.querySelector('span')).toHaveTextContent('yeah');

      const button = container.querySelector('button');
      if (button) fireEvent.click(button);

      expect(container.querySelector('span')).toHaveTextContent('hello world');
    });

    it('should render and apply model', () => {
      const { container } = render(
        <Provider store={store}>
          <TestInput />
        </Provider>
      );

      expect(container.querySelector('input[value]')).toBeTruthy();
      expect(container.querySelectorAll('li').length).toBe(3);

      const input = container.querySelector('input');
      if (input) fireEvent.change(input, { target: { value: 'write' } });

      expect(container.querySelector('span')).toHaveTextContent('write');
      expect(container.querySelectorAll('li').length).toBe(1);
    });

    it('should render and apply hooks', () => {
      const { container } = render(
        <Provider store={store}>
          <TestHooks />
        </Provider>
      );

      expect(container.querySelector('span')).toHaveTextContent('sample');

      const button = container.querySelector('button');
      if (button) fireEvent.click(button);

      expect(container.querySelector('span')).toHaveTextContent('hi world');
    });

    it('should render and apply api hooks', async () => {
      const { container } = render(
        <Provider store={store}>
          <TestAPI />
        </Provider>
      );

      expect(container.querySelector('span')).toHaveTextContent('pending');
      expect(container.querySelector('p')).toHaveTextContent('Loading posts...');

      await waitFor(() => {
        expect(container.querySelector('input')).toBeTruthy();
        expect(container.querySelector('span')).toHaveTextContent('fulfilled');
        expect(container.querySelectorAll('input').length).toBe(2);
      });

      const input = container.querySelector('input[name="input.2"]');
      if (input) fireEvent.change(input, { target: { value: 'test 2' } });

      await waitFor(() => {
        expect(container.querySelector('input[name="input.2"]')).toHaveAttribute('value', 'test 2');
      });

      const button = container.querySelector('button');
      if (button) fireEvent.click(button);

      expect(container.querySelector('button')).toHaveAttribute('status', 'pending');
      expect(container.querySelector('button[disabled]')).toBeTruthy();

      await waitFor(() => {
        expect(container.querySelector('button[disabled]')).toBeFalsy();
        expect(container.querySelector('button')).toHaveAttribute('status', 'fulfilled');
      });
    });
  });
});
