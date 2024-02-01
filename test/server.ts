import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('https://api.example.com/posts', () => {
    return HttpResponse.json([
      { id: 1, content: 'Post 1' },
      { id: 2, content: 'Post 2' },
    ]);
  }),
  http.put<{ id: string }, { content: string }>('https://api.example.com/posts/:id', async ({ params, request }) => {
    const { id } = params;
    const { content } = await request.json();
    return HttpResponse.json({ data: { id, content } });
  })
);
