import '@testing-library/jest-dom';
import { server } from './test/server'


beforeAll(() => server.listen({onUnhandledRequest: 'error'}))

afterEach(() => server.resetHandlers())

afterAll(async () => server.close())