# GenRate React Redux

[![npm package][npm-img]][npm-url] [![Build Status][build-img]][build-url] [![Downloads][downloads-img]][downloads-url] [![Issues][issues-img]][issues-url] [![codecov][codecov-img]][codecov-url] [![Commitizen Friendly][commitizen-img]][commitizen-url] [![Semantic Release][semantic-release-img]][semantic-release-url]

> GenRate React Redux package is combination of Genrate React and Redux approach

### Advantages 
- Separate Logic & Design
- Preserve UI Design
- Components Flexible Reusability
- Simplify re-render handling
- Encourage micro components

## Installation

```bash
npm install @genrate/react-redux
```

## Usage

### Component
```tsx
import { useData } from '@genrate/react-redux';
import PostAPI from '@api/posts';
import User from '@models/user';

// Output
const Avatar = ({ fullname }) => (
  <h5>{fullname}</h5>
);

const Post = ({ content = 'My first post' }) => (
  <li>
    {content}
  </li>
);

const PostFallback = ({ title = 'Loading ...' }) => (
  <p>{title}</p>
);

// Input
const AddPost = () => (
  <div>
    <input name="newPost" />
    <button>Add Post</button>
  </div>
);

// Layout
const Header = () => (
  <div>
    <Avatar />
    <button>Logout</button>
  </div>
);

const Footer = () => (<div>© 2024</div>);

const PostsLayout = () => (
  <div>
    <Header />
    <AddPost />
    <ul>
      <Post />
    </ul>
    <Footer />
  </div>
);

// Functionality 
const PostLists = () => {
  
  const { view, each, query, model, pass, attach } = useData({

    // local state
    local: {
      newPost: ''
    },

    // redux selectors
    selectors: {

      // manual selector 
      userId: () => (state) => state.user.id

      // using @generate/redux
      fullname: () => User.fullname,
    },

    // react hooks
    hooks: {

      // rtx query application
      posts: ({ userId }) => PostAPI.useGetByUserQuery(userId),

      // set specific data key for hooks that returns array
      'addPost|addStatus': () => PostAPI.useAddPostMutation(),
    },
  });

  // redux actions
  const logout = User.useLogout();

  // render only once

  return view(PostsLayout, {

    // query inside a component
    Header: query({

      // pass data to component as props
      Avatar: pass('fullname'),

      // apply action event
      button: () => () => ({
        onClick: () => logout()
      })
    }),
    
    
    AddPost: query({

      // bind input model default to `name` props
      input: model(),

      button: 
        // subscribe to specific data
        ({ newPost, addPost, addStatus }) => 

        // set props to button component
        () => ({
          onClick: () => addPost({ content: newPost }),
          disabled: addStatus.isLoading
        })
    }),
    
    // iterate component base on posts data
    Post: each(
      ({ posts }) =>
      () => posts?.data?.map(
        // pass content props to each post component
        p => ({ content: p.content })
      ) ?? [
        // attach fallback component when posts is loading or empty
        attach(PostFallback, { 
          title: posts?.isLoading ? 'Loading posts...' : 'No posts found' }
        )
      ]
    ),
  });
};
```
[build-img]: https://github.com/GenRate/genrate-react-redux/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/GenRate/genrate-react-redux/actions/workflows/release.yml
[downloads-img]: https://img.shields.io/npm/dt/@genrate/react-redux
[downloads-url]: https://www.npmtrends.com/@genrate/react-redux
[npm-img]: https://img.shields.io/npm/v/@genrate/react-redux
[npm-url]: https://www.npmjs.com/package/@genrate/react-redux
[issues-img]: https://img.shields.io/github/issues/GenRate/genrate-react-redux
[issues-url]: https://github.com/GenRate/genrate-react-redux/issues
[codecov-img]: https://codecov.io/gh/GenRate/genrate-react-redux/branch/master/graph/badge.svg?token=A0V6BNMPRY
[codecov-url]: https://codecov.io/gh/GenRate/genrate-react-redux
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[commitizen-img]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli/
